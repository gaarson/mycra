#!/usr/bin/env -S node --experimental-vm-modules

import main from '../index.js';

process.env.MYCRA_TEST_SELF = true;
main();
