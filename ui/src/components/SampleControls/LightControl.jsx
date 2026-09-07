/* eslint-disable jsx-a11y/control-has-associated-label */
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { sendExecuteCommand } from '../../api/hardware-object';
import {
  setAttribute,
  updateBeamlineHardwareObjectAction,
} from '../../actions/beamline';
import { HW_STATE } from '../../constants';
import styles from './SampleControls.module.css';

function LightControl(props) {
  const { label, hwoId } = props;
  const dispatch = useDispatch();

  const light = useSelector((state) => state.beamline.hardwareObjects[hwoId]);

  if (!light) {
    return null;
  }

  const switchValue = light.switch_value || 'OUT';
  const switchCommands = light.switch_commands || ['IN', 'OUT'];

  async function handleToggleClick() {
    const next = switchCommands.find((cmd) => cmd !== switchValue);
    const res = await sendExecuteCommand('light', hwoId, 'set_switch', {
      value: next,
    });

    // The backend also pushes the new state over the socket; applying the
    // returned value keeps the button in sync if that message is missed.
    if (res && switchCommands.includes(res.return)) {
      dispatch(
        updateBeamlineHardwareObjectAction({
          name: hwoId,
          switch_value: res.return,
        }),
      );
    }
  }

  return (
    <div className={styles.controlWrapper}>
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="bottom"
        overlay={
          <Popover id={`${hwoId}_popover`} className={styles.popover} body>
            <input
              className="bar"
              type="range"
              step="0.1"
              min={light.limits[0]}
              max={light.limits[1]}
              value={light.value}
              disabled={light.state !== HW_STATE.READY}
              onChange={(evt) =>
                dispatch(setAttribute(hwoId, evt.target.value))
              }
            />
          </Popover>
        }
      >
        {({ ref, ...triggerHandlers }) => (
          <>
            <Button
              ref={ref}
              className={styles.lightBtn}
              data-default-styles
              active={switchValue === 'IN'}
              title={`${label} on/off`}
              onClick={handleToggleClick}
            >
              <i className={`${styles.controlIcon} fas fa-lightbulb`} />
              <span className={styles.controlLabel}>{label}</span>
            </Button>
            <Button
              className={styles.lightArrowBtn}
              data-default-styles
              {...triggerHandlers}
            >
              <i className="fas fa-sort-down" />
            </Button>
          </>
        )}
      </OverlayTrigger>
    </div>
  );
}

export default LightControl;
