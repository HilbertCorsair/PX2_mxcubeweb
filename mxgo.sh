#!/bin/bash 

export MURKO_PATH=/nfs/ruche/share-dev/px1dev/Arthur/murko-develop
export MURKO_SIZEX=1360
export MURKO_SIZEY=1024
export MURKO_HOST=localhost
export MURKO_PORT=89011
export PATH=/nfs/ruche/share-dev/px2dev/MXCuBE/WebApp/mxcubeweb:$PATH
export PYTHONPATH=/nfs/ruche/share-dev/px2dev/MXCuBE/WebApp/mxcubeweb:$PYTHONPATH
export PYTHONPATH=/nfs/ruche/share-dev/px2dev/MXCuBE/WebApp/mxcubecore/:$PYTHONPATH

export PYTHONPATH=/nfs/ruche/share-dev/px2dev/MXCuBE/WebApp/experimental_methods/:$PYTHONPATH

# --- Argussight camera stack ------------------------------------------------
# argussight is the single video-streamer source for SampleView (OAV + the four
# hutch cameras). Its start scripts live on the beamline here:
ARGUS_DIR=/usr/local/experimental_methods
# argus_cameras.py spawns `video-streamer` by bare name, so the mxcubeweb conda
# env's bin (which holds that console script) must be on PATH -- start_argus.sh
# runs the helpers with that env's interpreter but does not put it on PATH.
STREAMER_ENV_BIN=/home/experiences/proxima2a/px2dev/miniconda3/envs/mxcubeweb/bin
export PATH="$STREAMER_ENV_BIN:$PATH"

start_argussight() {
    if pgrep -f argussight >/dev/null 2>&1; then
        echo "argussight already running; not starting a second instance"
        return
    fi
    # Decide whether start_argus.sh should also own the OAV publisher. If frames
    # are already arriving on the mxcubeweb redis pub/sub channel, oav_camera.py
    # is running elsewhere -> start argussight WITHOUT --with-oav. Otherwise start
    # it WITH --with-oav so start_argus.sh launches `oav_camera.py -m redis_bzoom
    # --mxcube` itself. If we cannot probe redis, default to --with-oav so video
    # is guaranteed rather than silently missing.
    local flag="--with-oav"
    if command -v redis-cli >/dev/null 2>&1; then
        if timeout 3 redis-cli SUBSCRIBE mxcubeweb 2>/dev/null | grep -q '"message"'; then
            echo "oav_camera already publishing on redis channel 'mxcubeweb'; starting argussight without --with-oav"
            flag=""
        else
            echo "no frames on redis channel 'mxcubeweb'; starting argussight with --with-oav"
        fi
    else
        echo "redis-cli not found; cannot probe 'mxcubeweb' channel -- starting argussight with --with-oav"
    fi
    # Backgrounded: it shares mxgo.sh's process group, so Ctrl-C here also stops
    # argussight (its own trap cleanup kills the camera streamers).
    "$ARGUS_DIR/start_argus.sh" $flag &
}

# argussight + streamers started manually (start_argus.sh --with-oav already
# running); skip auto-start here.
# start_argussight

# Run the real beamline config (webconfig) directly, by absolute path. The old
# `--export-yaml-config .../config/` pass wrote a lossy normalized copy (truncated
# class strings, reindented server.yaml) into the hardcoded default dir
# (mxcubeweb/__init__.py:28 = .../WebApp/config) that the following `-r` then
# loaded -> lims/detector = None -> usermanager crash, and printed the HW table
# twice. `-r` reads the source config directly, so one clean load. The dir must
# contain a file named exactly `beamline.yaml` (HardwareRepository.BEAMLINE_CONFIG_FILES).
CONFIG_DIR=/nfs/ruche/share-dev/px2dev/MXCuBE/WebApp/webconfig
mxcubeweb-server -r "$CONFIG_DIR" --static-folder $(pwd)/mxcubeweb/ui/build/ -L debug -l $HOME/MXCuBElogs/mxcube.log
