#!/bin/sh -e

ME=$(basename $0)

log_() { echo "[$ME] $@"; }

log_ "--> Setting up symlinks"
cd node_modules
[ -L __ ] || ln -s ../lib __
[ -L server ] || ln -s ../server server
cd ../server
[ -L config.js ] || ln -s ../config.js config.js
