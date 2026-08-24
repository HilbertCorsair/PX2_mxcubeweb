import { Button, Card, ButtonGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { sendCommand } from '../../actions/sampleChanger';
import ActionButton from './ActionButton';
import ActionGroup from './ActionGroup';
import styles from './equipment.module.css';

const LIDS = [1, 2, 3];

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

  return (
    <>
      {commandGroups.map(([grpLabel, grpCmds]) =>
        grpLabel === 'Lids' ? (
          <Card key={grpLabel} className="mb-2">
            <Card.Header>{grpLabel}</Card.Header>
            <Card.Body>
              <ButtonGroup>{LIDS.map((n) => renderLidToggle(n))}</ButtonGroup>
            </Card.Body>
          </Card>
        ) : (
          <ActionGroup key={grpLabel} label={grpLabel}>
            {grpCmds.map(([cmd, cmdLabel, , cmdArgs]) => (
              <ActionButton
                key={cmd}
                label={cmdLabel}
                disabled={!commands_state[cmd]}
                onSend={() => dispatch(sendCommand(cmd, cmdArgs))}
              />
            ))}
          </ActionGroup>
        ),
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
