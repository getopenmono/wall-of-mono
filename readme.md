# Wall Of Mono

Interactively control a wall of 4 x 8 Monos.

## Endpoints

| Endpoint  | Function |
| --------- | -------- |
| `/`       | Returns the HTML page for the UI for using `/set` endpoint |
| `/get`    | Returns concise representation of all Monos on the wall. |
| `/set`    | Post with fields `x`, `y`, `foreground`, `background`, `letter` to set a specific Mono.  |

The web service has the following admistrative endpoints:

| Endpoint  | Function |
| --------- | -------- |
| `/status` | Returns the service status as JSON. |
| `/pid`    | Returns the service's process id.   |

----

[![Build Status](https://travis-ci.org/getopenmono/wall-of-mono.svg?branch=master)](https://travis-ci.org/getopenmono/wall-of-mono)
[![Docker build status](https://img.shields.io/docker/build/getopenmono/wall-of-mono.svg)](https://hub.docker.com/r/monolit/wall-of-mono/builds/)
