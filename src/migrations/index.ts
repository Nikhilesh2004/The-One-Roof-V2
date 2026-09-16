import * as migration_20260906_110419_initial from './20260906_110419_initial';
import * as migration_20260906_111954_add_shop_given_name from './20260906_111954_add_shop_given_name';
import * as migration_20260906_160247_maintained_by_credit from './20260906_160247_maintained_by_credit';
import * as migration_20260906_161224_designed_and_maintained from './20260906_161224_designed_and_maintained';
import * as migration_20260906_161940_maintainer_credit from './20260906_161940_maintainer_credit';
import * as migration_20260906_180425_gstin_and_grievance from './20260906_180425_gstin_and_grievance';

export const migrations = [
  {
    up: migration_20260906_110419_initial.up,
    down: migration_20260906_110419_initial.down,
    name: '20260906_110419_initial',
  },
  {
    up: migration_20260906_111954_add_shop_given_name.up,
    down: migration_20260906_111954_add_shop_given_name.down,
    name: '20260906_111954_add_shop_given_name',
  },
  {
    up: migration_20260906_160247_maintained_by_credit.up,
    down: migration_20260906_160247_maintained_by_credit.down,
    name: '20260906_160247_maintained_by_credit',
  },
  {
    up: migration_20260906_161224_designed_and_maintained.up,
    down: migration_20260906_161224_designed_and_maintained.down,
    name: '20260906_161224_designed_and_maintained',
  },
  {
    up: migration_20260906_161940_maintainer_credit.up,
    down: migration_20260906_161940_maintainer_credit.down,
    name: '20260906_161940_maintainer_credit',
  },
  {
    up: migration_20260906_180425_gstin_and_grievance.up,
    down: migration_20260906_180425_gstin_and_grievance.down,
    name: '20260906_180425_gstin_and_grievance'
  },
];
