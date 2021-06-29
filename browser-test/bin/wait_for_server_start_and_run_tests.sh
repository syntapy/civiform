#!/usr/bin/env bash

set -euo pipefail

start_time=$(date +%s)
deadline=$(($start_time + 200))
https_url=https://civiform:9000
http_url=http://civiform:9001

echo polling to check server start

until $(curl --output /dev/null --silent --head --fail --max-time 2 $http_url); do
    if (( $(date +%s) > $deadline )); then
        echo "deadline exceeded waiting for server start"
        exit 1
    fi
done

echo detected server start

debug=0
for arg do
    shift
    # if debug flag, set the var and leave it out of the forwarded args list
    [ "$arg" = "--debug" ] && debug=1 && continue
    set -- "$@" "$arg"
done

if (( $debug == 1 )); then
    PWDEBUG=$PWDEBUG DEBUG=pw:api BASE_URL=$https_url yarn test $@
else
    BASE_URL=$https_url yarn test $@
fi

