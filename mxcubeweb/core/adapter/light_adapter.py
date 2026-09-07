"""Adapter for MicrodiffLight — exposes level + on/off in one redux entry.

Extends MotorAdapter so the slider gets ``limits``/``value``/``state``
unchanged. Adds ``switch_value`` and ``switch_commands`` to the data
payload, plus a ``set_switch`` command, so ``LightControl.jsx`` can drive
the on/off button off the same hardware object as the slider.
"""

import logging
from typing import ClassVar

from mxcubecore.HardwareObjects.MicrodiffLight import MicrodiffLight

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.adapter.motor_adapter import MotorAdapter
from mxcubeweb.core.models.adaptermodels import HOLightModel
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel
from mxcubeweb.core.util.networkutils import RateLimited

resource_handler_config = ResourceHandlerConfigModel(
    commands=["set_value", "set_switch", "stop"],
    attributes=["data", "get_value"],
)


class LightAdapter(MotorAdapter):
    SUPPORTED_TYPES: ClassVar[list[object]] = [MicrodiffLight]

    def __init__(self, ho, role, app):
        # Skip MotorAdapter.__init__ to use our own resource_handler_config
        # (with `set_switch`), while still wiring the same signals.
        ActuatorAdapterBase.__init__(self, ho, role, app, resource_handler_config)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)
        ho.connect("lightSwitchChanged", self._switch_change)

    @RateLimited(10)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def _switch_change(self, _value):
        # Push the whole data payload so the redux merge picks up
        # both `switch_value` and any related fields.
        self.emit_ho_changed(self._ho.get_state())

    def set_switch(self, value: str) -> str:
        self._ho.set_switch(value)
        # The HTTP route calls this method directly, bypassing
        # AdapterBase.execute_command / _command_success -- which is what
        # normally emits `hardware_object_changed` after a command. Push the
        # fresh payload ourselves so the button updates even if the MD2 never
        # sends a channel event.
        self.emit_ho_changed(self._ho.get_state())
        return self._ho.switch_value()

    def _dict_repr(self):
        data = super()._dict_repr()
        try:
            data["switch_value"] = self._ho.switch_value()
            data["switch_commands"] = self._ho.switch_commands()
        except Exception:
            logging.getLogger("MX3.HWR").exception(
                f"Could not read switch state of {self._ho.name}"
            )
            data["switch_value"] = "OUT"
            data["switch_commands"] = ["IN", "OUT"]
        return data

    def data(self) -> HOLightModel:
        return HOLightModel(**self._dict_repr())
