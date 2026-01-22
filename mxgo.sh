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
mxcubeweb-server --export-yaml-config $(pwd)/../config/
mxcubeweb-server -r $(pwd)/../config/ --static-folder $(pwd)/mxcubeweb/ui/build/ -L debug -l $HOME/MXCuBElogs/mxcube.log
