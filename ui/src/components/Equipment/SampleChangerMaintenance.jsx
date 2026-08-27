import { Button, Card, ButtonGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { sendCommand } from '../../actions/sampleChanger';
import ActionButton from './ActionButton';
import ActionGroup from './ActionGroup';
import styles from './equipment.module.css';

const LIDS = [1, 2, 3];
const REGULATION_CMDS = new Set(['regulon', 'reguloff']);

function SampleChangerMaintenance() {
  const dispatch = useDispatch();

  const { commands, commands_state, global_state, message } = useSelector(
    (state) => state.sampleChangerMaintenance,
  );

  const commandGroups = commands.cmds || [];

  // One reactive OPEN/CLOSE switch per lid, driven by the live lid state
  // (global_state.lidN, true = open) instead of six separate buttons. Clicking
  // sends the opposite command; the button disables per the backend's
  // per-command availability (commands_state.openlidN / closelidN).
  function renderLidToggle(n) {
    const open = Boolean(global_state?.[`lid${n}`]);
    const cmd = open ? `closelid${n}` : `openlid${n}`;
    return (
      <Button
        key={`lid${n}`}
        className="me-2"
        size="sm"
        variant={open ? 'outline-success' : 'outline-secondary'}
        disabled={!commands_state[cmd]}
        onClick={() => dispatch(sendCommand(cmd))}
      >
        {`Lid ${n}: ${open ? 'OPEN' : 'CLOSED'}`}
      </Button>
    );
  }

  // Same idea for LN2 regulation: one reactive switch driven by
  // global_state.regulating instead of a one-way "Regulation On" button.
  // Green while regulating, red while not; the backend enables whichever
  // direction is applicable and disables both when the power is off.
  function renderRegulationToggle() {
    const regulating = Boolean(global_state?.regulating);
    const cmd = regulating ? 'reguloff' : 'regulon';
    return (
      <Button
        key="regulation"
        className="me-2"
        size="sm"
        variant={regulating ? 'outline-success' : 'outline-danger'}
        disabled={!commands_state[cmd]}
        onClick={() => dispatch(sendCommand(cmd))}
      >
        {`Regulation: ${regulating ? 'ON' : 'OFF'}`}
      </Button>
    );
  }

  function renderActionButtons(grpCmds) {
    return grpCmds.map(([cmd, cmdLabel, , cmdArgs]) => (
      <ActionButton
        key={cmd}
        label={cmdLabel}
        disabled={!commands_state[cmd]}
        onSend={() => dispatch(sendCommand(cmd, cmdArgs))}
      />
    ));
  }

  function renderGroup(grpLabel, grpCmds) {
    if (grpLabel === 'Lids') {
      return (
        <Card key={grpLabel} className="mb-2">
          <Card.Header>{grpLabel}</Card.Header>
          <Card.Body>
            <ButtonGroup>{LIDS.map((n) => renderLidToggle(n))}</ButtonGroup>
          </Card.Body>
        </Card>
      );
    }

    if (grpLabel === 'Power') {
      // The two regulation commands are replaced by a single toggle.
      return (
        <ActionGroup key={grpLabel} label={grpLabel}>
          {renderActionButtons(
            grpCmds.filter(([cmd]) => !REGULATION_CMDS.has(cmd)),
          )}
          {renderRegulationToggle()}
        </ActionGroup>
      );
    }

    return (
      <ActionGroup key={grpLabel} label={grpLabel}>
        {renderActionButtons(grpCmds)}
      </ActionGroup>
    );
  }

  return (
    <>
      {commandGroups.map(([grpLabel, grpCmds]) =>
        renderGroup(grpLabel, grpCmds),
      )}

      {message && (
        <Card className="mb-2">
          <Card.Header>Status message</Card.Header>
          <Card.Body>
            <span className={styles.scMessage}>{message}</span>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

export default SampleChangerMaintenance;
