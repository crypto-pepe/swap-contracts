import {
  Account, Asset,
  getAccountByName,
  getAssetBalance,
  getAssetByName,
  getContractByName,
  getDataValue,
  setContractState,
  transfer
} from '@pepe-team/waves-sc-test-utils';
import { step, stepCatchError, stepIgnoreErrorByMessage } from 'relax-steps-allure';
import { getEnvironment } from 'relax-env-json';
import {dropBalanceDen, swap } from '../../steps/crosschain.swap';
import { expect } from 'chai';
import { getAssetContractBalance, sendMoneyToContract, stepCatchErrorWithMessage } from '../../steps/common';
import { getEquilibrium, getThreshold, getTokenFee } from './helpers/swap.math';
const env = getEnvironment();

/**
 * BUGS:
 *
 * COMMENTS:  5) [SWAP][MINOR] lpAssetId not used in swap function (line 939)
 *            6) [SWAP][NORMAL] unlocked flag not used
 *            7) [SWAP][MINOR] lpTotalSupply not used in swap function (line 940)
 *            8) [SWAP][MINOR] payment size validation must be before payment usage
 *            14) You can't paused this contract
 *            15) [SWAP][MAJOR] when you validate balances in unbalanced pool - you can't swap (still up/down error) - FEATURE!
 *                it must work with more than 3 assets (here for remember)
 *            16) possible to swap with rewards when destabilize pool from BD to CE
 *            17) possible to swap with rewards when stabilize pool from BD to AB
 *
 * SOLVED:    2) [SWAP][MAJOR] AssetIDs not verified correctly on lines 938, 939 - if I use asset not in list - it's not catched
 *            3) [SWAP][MINOR] Have no verification for same source and target asset IDs
 *            4) [SWAP][MINOR] Have no check for payment count (possible to set payments more than 1)
 *            1) [SWAP][MAJOR] Output list size = 32 exceeds limit = 20 for split (line 988)
 *            9) [SWAP][MAJOR] Index 0 out of bounds for length 0
 *            11) [SWAP][MAJOR] swap: can't calculate targetAmount
 *            12) [SWAP][MAJOR] Incorrect calculation of prevAssetBalances (line 968)
 *            10) [SWAP][NORMAL] Division by zero error when contract has no balance of both tokens
 *            13) [SWAP][MAJOR] asset validation failed if lpTocen decimals less than target and source tokens decimals
 *            16) [SWAP][MAJOR] wrong calculation of slippage fee - needed to divide by 1000000
 */
describe('swap() component tests', function () {
  it('should throw when target asset id is wrong', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const usdn = getAssetByName('USDN', this.parent?.ctx);
    const weth = getAssetByName('WETH', this.parent?.ctx);
    const wbtc = getAssetByName('WBTC', this.parent?.ctx);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            // { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
            { key: 'STORAGE', type: 'string', value: '' },
            { key: 'ASSETS', type: 'string', value: `${weth.assetId}__${usdn.assetId}` }
            //
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: invalid source asset',
      async () => {
        await swap(usdn.assetId, 0, [{ assetId: wbtc.assetId, amount: 1 }], user);
      }
    );
  });

  it('should throw when source asset id is wrong', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const usdn = getAssetByName('USDN', this.parent?.ctx);
    const weth = getAssetByName('WETH', this.parent?.ctx);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            // { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
            { key: 'STORAGE', type: 'string', value: '' },
            { key: 'ASSETS', type: 'string', value: `${weth.assetId}__${usdn.assetId}` }
            //
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: invalid target asset',
      async () => {
        await swap('waves', 0, [{ assetId: usdn.assetId, amount: 1 }], user);
      }
    );
  });

  it('should throw when source asset id is equal to target asset id', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const usdn = getAssetByName('USDN', this.parent?.ctx);
    const weth = getAssetByName('WETH', this.parent?.ctx);
    const lp = getAssetByName('WBTC', this.parent?.ctx);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            // { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
            { key: 'STORAGE', type: 'string', value: `${lp.assetId}__1__0__50000__50000__1000000__200000__50000__1000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${weth.assetId}__${usdn.assetId}` }
            //
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: same assets',
      async () => {
        await swap(usdn.assetId, 0, [{ assetId: usdn.assetId, amount: 1 }], user);
      }
    );
  });

  it('should throw when payment amount is zero', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const usdn = getAssetByName('USDN', this.parent?.ctx);
    const weth = getAssetByName('WETH', this.parent?.ctx);
    const lp = getAssetByName('WBTC', this.parent?.ctx);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            // { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
            { key: 'STORAGE', type: 'string', value: `${lp.assetId}__1__0__50000__50000__1000000__200000__50000__1000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${weth.assetId}__${usdn.assetId}` }
            //
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    const isError = await stepCatchError(
      'try to swap',
      async () => {
        await swap(usdn.assetId, 0, [{ assetId: usdn.assetId, amount: 0 }], user);
      }
    );
    await step('check error', async () => {
      expect(isError).is.true;
    });
  });

  it('should throw when payments more than needed (> 1)', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const usdn = getAssetByName('USDN', this.parent?.ctx);
    const weth = getAssetByName('WETH', this.parent?.ctx);
    const lp = getAssetByName('WBTC', this.parent?.ctx);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            // { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
            { key: 'STORAGE', type: 'string', value: `${lp.assetId}__1__0__50000__50000__1000000__200000__50000__1000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${weth.assetId}__${usdn.assetId}` }
            //
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: invalid payments size',
      async () => {
        await swap(
          usdn.assetId,
          0,
          [
            { assetId: weth.assetId, amount: 1 },
            { assetId: usdn.assetId, amount: 1 },
          ],
          user);
      }
    );
  });

  // BUG (minor)! error message must be: 'Error while executing dApp: swap: invalid payments size'
  it('should throw when no payments', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const usdn = getAssetByName('USDN', this.parent?.ctx);
    const weth = getAssetByName('WETH', this.parent?.ctx);
    const lp = getAssetByName('WBTC', this.parent?.ctx);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            // { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
            { key: 'STORAGE', type: 'string', value: `${lp.assetId}__1__0__50000__50000__1000000__200000__50000__1000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${weth.assetId}__${usdn.assetId}` }
            //
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      // 'Error while executing dApp: swap: invalid payments size',
      'Error while executing dApp: Index 0 out of bounds for length 0',
      async () => {
        await swap(usdn.assetId, 0, [], user);
      }
    );
  });

  it('should throw when insufficient final amount', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount * 1000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${targetToken.assetId}__1__${exchangeAmount * 1000}__0__0__1000000__500000__1__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 1000, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 1000, targetToken.assetId);
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: insufficient final amount',
      async () => {
        await swap(targetToken.assetId, exchangeAmount + 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
  });

  /**
   * TODO: ADD TESTS FOR fee variants
   */
  it('swap in point A tokens with equal decimals', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME4', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const exchangeAmount = 100000000;
    const setAmount = exchangeAmount * 1000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${targetToken.assetId}__1__${exchangeAmount * 1000}__100000__150000__1000000__500000__1__350000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '5000000__5000000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 1000 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 1000}__${exchangeAmount * 1000}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(sourceToken, user, env.network);
    await step('try to swap', async () => {
      await swap(targetToken.assetId, 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + exchangeAmount - Math.floor(exchangeAmount * 0.25));
    });
  });

  // CHECK IT
  xit('should throw when can\'t calculate targetAmount', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount + Math.floor(exchangeAmount * 0.2);
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__100000__100000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount}__${setAmount}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    await step(//IgnoreErrorByMessage(
      'try to swap',
      // 'Error while executing dApp: swap: can\'t calculate targetAmount=6900000',
      async () => {
        await swap(targetToken.assetId, exchangeAmount + 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
  });

  // CHECK IT
  xit('should throw when calculated amount became less than 0', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__100000__100000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: less than 0',
      async () => {
        await swap(targetToken.assetId, exchangeAmount + 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
  });

  it('should throw when target token amount less than minAmount', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount * 20;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__100000__100000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    await stepIgnoreErrorByMessage(
      'try to swap',
      'Error while executing dApp: swap: insufficient final amount',
      async () => {
        await swap(targetToken.assetId, exchangeAmount + 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
  });

  it('swap when target n source token decimals less than lpToken decimals', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('SPEC2', this.parent?.ctx);
    const sourceToken = getAssetByName('SPEC1', this.parent?.ctx);
    const lpToken = getAssetByName('SPECLP', this.parent?.ctx);
    const exchangeAmount = 10000;
    const setAmount = exchangeAmount * 100;
    const coef = 0.35;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__100000__250000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 10000}__${setAmount * 10000}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 10000, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 10000, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(sourceToken, user, env.network);
    const checkAmount = exchangeAmount - Math.floor(exchangeAmount * coef);
    await step('swap', async () => {
      await swap(targetToken.assetId, checkAmount, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + checkAmount);
    });
  });

  it('swap when target n source token decimals more than lpToken decimals', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME4', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME5', this.parent?.ctx);
    const lpToken = getAssetByName('SPECLP2', this.parent?.ctx);
    const exchangeAmount = 100000000;
    const setAmount = exchangeAmount * 100;
    const coef = 0.196;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__130000__66000__1000000__500000__50000__400000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    const checkAmount = exchangeAmount - Math.floor(exchangeAmount * coef);
    await step('swap', async () => {
      await swap(targetToken.assetId, checkAmount, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + checkAmount);
    });
  });

  // CHECK IT
  xit('swap when target token decimals less than lpToken decimals and source token decimals more', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME13', this.parent?.ctx);
    const sourceToken = getAssetByName('SPEC1', this.parent?.ctx);
    const lpToken = getAssetByName('SPECLP3', this.parent?.ctx);
    const exchangeAmount = 10000;
    const setAmount = exchangeAmount * 100;
    const coef = 0.226;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__130000__96000__1000000__500000__50000__400000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 1000}__${setAmount * 1000}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '500000__500000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 1000, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    const checkAmount = exchangeAmount * 1000 - Math.floor(exchangeAmount * 1000 * coef);
    await step('swap', async () => {
      await swap(targetToken.assetId, checkAmount, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + checkAmount);
    });
  });

  it('should throw with _validateAssetAllocation: new up error', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount * 2;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 2}__100000__100000__499999__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '50__50' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(targetToken.assetId, 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: _validateAssetAllocation: new up');
    });
  });

  it('should throw with _validateAssetAllocation: still up error', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 100}__100000__100000__299999__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '50__50' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 65}__${setAmount * 35}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 65, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 35, targetToken.assetId);
    });
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(targetToken.assetId, 0, [{ assetId: sourceToken.assetId, amount: 1 }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: _validateAssetAllocation: still up');
    });
  });

  it('should throw with _validateAssetAllocation: new down', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('SPEC1', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('SPECLP3', this.parent?.ctx);
    const exchangeAmount = 13660;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 2000}__100000__100000__9999__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_BALANCES', type: 'string', value: `${Math.floor(exchangeAmount * 2000 * 0.3)}__${Math.floor(exchangeAmount * 2000 * 0.7)}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '30__70' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2000 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2000}__${exchangeAmount * 2000}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, Math.floor(exchangeAmount * 20000 * 0.3), sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, Math.floor(exchangeAmount * 2 * 0.7), targetToken.assetId);
    });
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(sourceToken.assetId, 1, [{ assetId: targetToken.assetId, amount: Math.floor(exchangeAmount * 0.1) }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: _validateAssetAllocation: new down');
    });
  });

  it('should throw with _validateAssetAllocation: still down', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('SPEC2', this.parent?.ctx);
    const lpToken = getAssetByName('SPECLP3', this.parent?.ctx);
    const exchangeAmount = 6613;
    const w1 = 37;
    const w2 = 63;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 100 * 1000}__100000__100000__9999__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '35__65' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * w1 * 1000}__${exchangeAmount * w2 * 1000}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 10000 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 10000}__${exchangeAmount * 10000}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * w1, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * w2 * 10000, targetToken.assetId);
    });
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(sourceToken.assetId, 0, [{ assetId: targetToken.assetId, amount: exchangeAmount * 10000 }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: _validateAssetAllocation: still down');
    });
  });

  it('should throw when still up but target token goes down', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 10000000;
    const setAmount = exchangeAmount;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 100}__34567__25433__0__0__0__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '50__50' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 65}__${setAmount * 35}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 65, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 35, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(sourceToken.assetId, 0, [{ assetId: targetToken.assetId, amount: exchangeAmount }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: _validateAssetAllocation: still down');
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance);
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(targetToken, contract, env.network))
        .to.be.equal(setAmount * 35);
      expect(await getAssetContractBalance(sourceToken, contract, env.network))
        .to.be.equal(setAmount * 65);
    });
  });

  it('should throw when still down but target token goes up', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('SPEC1', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 12345;
    const w1 = 65;
    const w2 = 35;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 100 * 10000}__34567__25433__0__0__0__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '50__50' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * w1 * 10000}__${exchangeAmount * w2 * 10000}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100000 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100000}__${exchangeAmount * 100000}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * w1, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * w2 * 10000, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(targetToken.assetId, 0, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: _validateAssetAllocation: still up');
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance);
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(targetToken, contract, env.network))
        .to.be.equal(exchangeAmount * w2 * 10000);
      expect(await getAssetContractBalance(sourceToken, contract, env.network))
        .to.be.equal(exchangeAmount * w1);
    });
  });

  it('should throw when balance equals 0 for both tokens', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__0__100000__250000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '5000000__5000000' },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 0 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 0}__${exchangeAmount * 0}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
    });
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(targetToken.assetId, exchangeAmount, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: swap: insufficient final amount');
    });
  });

  it('should throw when target token balance equals 0', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const setAmount = exchangeAmount * 100;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount}__100000__250000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '5000000__5000000' },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount}__${setAmount}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
    });
    const result = await stepCatchErrorWithMessage(
      'try to swap',
      async () => {
        await swap(targetToken.assetId, exchangeAmount, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
      }
    );
    await step('check error', async () => {
      expect(result.isError).is.true;
      expect(result.message).to.be.equal('Error while executing dApp: swap: insufficient final amount');
    });
  });

  it('swap when source token balance equals 0', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const setAmount = exchangeAmount * 100;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount}__100000__250000__1000000__500000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '50__50' },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount}__${setAmount}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('swap', async () => {
      await swap(targetToken.assetId, 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + exchangeAmount - Math.floor(exchangeAmount * 0.35));
    });
  });

  it('swap the minimal amount', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME6', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const setAmount = exchangeAmount * 100;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${setAmount * 100}__60000__40000__1000000__50000__130000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '50__50' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount}__${setAmount}` },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount * 100}__${setAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, setAmount, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('swap', async () => {
      await swap(targetToken.assetId, exchangeAmount - Math.floor(exchangeAmount * 0.1), [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + exchangeAmount - Math.floor(exchangeAmount * 0.1));
    });
  });

  it('swap up in point A tokens with equal decimals with different weights', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME4', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 100}__60000__40000__130000__50000__130000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '250__750' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 75}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 75, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('try to swap', async () => {
      await swap(targetToken.assetId, 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + exchangeAmount - Math.floor(exchangeAmount * 0.1));
    });
  });

  it('swap down in point A tokens with equal decimals with different weights', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME4', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 100}__60000__40000__130000__50000__130000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '250__750' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 75}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 75, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('try to swap', async () => {
      await swap(sourceToken.assetId, 1, [{ assetId: targetToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance - exchangeAmount);
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance + exchangeAmount - Math.floor(exchangeAmount * 0.1));
    });
  });

  it('swap with various weights (1_1 for example)', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME4', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 100}__60000__40000__20000__50000__20000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '1__1' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 50}__${exchangeAmount * 50}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 50, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 50, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('try to swap', async () => {
      await swap(targetToken.assetId, 1, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + exchangeAmount - Math.floor(exchangeAmount * 0.1));
    });
  });

  it('swap when targetToken amount became 0', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME4', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 2}__0__0__1000000__0__0__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '1__1' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount}__${exchangeAmount}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('try to swap', async () => {
      await swap(targetToken.assetId, exchangeAmount, [{ assetId: sourceToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance - exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance + exchangeAmount);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(sourceToken, contract, env.network))
        .to.be.equal(exchangeAmount * 2);
      expect(await getAssetContractBalance(targetToken, contract, env.network))
        .to.be.equal(0);
    });
  });

  it('swap when sourceToken amount became 0', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const sourceToken = getAssetByName('NAME4', this.parent?.ctx);
    const targetToken = getAssetByName('NAME5', this.parent?.ctx);
    const lpToken = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${lpToken.assetId}__1__${exchangeAmount * 2}__0__0__1000000__0__0__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${sourceToken.assetId}__${targetToken.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '1__1' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount}__${exchangeAmount}` },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 2 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 2}__${exchangeAmount * 2}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(sourceToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, sourceToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount, sourceToken.assetId);
      if (await getAssetContractBalance(targetToken, contract, env.network) > 0) {
        await dropBalanceDen(techUser, targetToken);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount, targetToken.assetId);
    });
    const startSTBalance = await getAssetBalance(sourceToken, user, env.network);
    const startTTBalance = await getAssetBalance(targetToken, user, env.network);
    await step('try to swap', async () => {
      await swap(sourceToken.assetId, exchangeAmount, [{ assetId: targetToken.assetId, amount: exchangeAmount }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(sourceToken, user, env.network))
        .to.be.equal(startSTBalance + exchangeAmount);
      expect(await getAssetBalance(targetToken, user, env.network))
        .to.be.equal(startTTBalance - exchangeAmount);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(sourceToken, contract, env.network))
        .to.be.equal(0);
      expect(await getAssetContractBalance(targetToken, contract, env.network))
        .to.be.equal(exchangeAmount * 2);
    });
  });

  it('swap, imbalanced pool, but exchange decreases imbalance, four tokens', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    const setAmount = exchangeAmount;
    const weight = 4;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__${setAmount * 100}__60000__40000__200000__0__0__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 31}__${setAmount * 25}__${setAmount * 25}__${setAmount * 19}` },
            { key: `LP_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount * 100}__${setAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 31, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 25, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 19, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const startBalance3 = await getAssetBalance(token3, user, env.network);
    const startBalance4 = await getAssetBalance(token4, user, env.network);
    await step('swap', async () => {
      await swap(token1.assetId, 1, [{ assetId: token2.assetId, amount: exchangeAmount * weight }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 - exchangeAmount * weight);
      expect(await getAssetBalance(token1, user, env.network))
        .to.be.equal(startBalance1 + exchangeAmount * weight - Math.floor(exchangeAmount * 0.1 * weight));
      expect(await getAssetBalance(token3, user, env.network))
        .to.be.equal(startBalance3);
      expect(await getAssetBalance(token4, user, env.network))
        .to.be.equal(startBalance4);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(token1, contract, env.network))
        .to.be.equal(setAmount * 31 - exchangeAmount * weight + Math.floor(exchangeAmount * 0.1 * weight));
      expect(await getAssetContractBalance(token2, contract, env.network))
        .to.be.equal(setAmount * 25 + exchangeAmount * weight);
      expect(await getAssetContractBalance(token3, contract, env.network))
        .to.be.equal(setAmount * 25);
      expect(await getAssetContractBalance(token4, contract, env.network))
        .to.be.equal(setAmount * 19);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token1.assetId}`, env.network))
        .to.be.equal(Math.floor(exchangeAmount * 0.06 * weight));
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token1.assetId}`, env.network))
        .to.be.equal(Math.floor(exchangeAmount * 0.04 * weight));
    });
    await step('check balances in state', async () => {
      expect(await getDataValue(contract, 'ASSET_BALANCES', env.network))
        .to.be.equal(`${setAmount * 31 - exchangeAmount * weight}__${setAmount * 25 + exchangeAmount * weight}__${setAmount * 25}__${setAmount * 19}`);
    });
  });

  it('swap, imbalanced pool, but exchange decreases imbalance, four tokens, diffirent decimals', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('SPEC1', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('SPECLP3', this.parent?.ctx);
    const exchangeAmount = 100000000;
    const setAmount = exchangeAmount;
    const weight = 4;
    const startLpFee = 136613;
    const startProtocolFee = 661313;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__${setAmount}__60000__40000__200000__0__0__0__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 31 / 100}__${setAmount * 25 / 100}__${setAmount * 25 / 100}__${setAmount * 19 / 100}` },
            { key: `LP_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: `LP_FEE__${token4.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token4.assetId}`, type: 'integer', value: 0 },
            { key: `LP_FEE__${token3.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token3.assetId}`, type: 'integer', value: 0 },
            { key: `LP_FEE__${token2.assetId}`, type: 'integer', value: startLpFee },
            { key: `PROTOCOL_FEE__${token2.assetId}`, type: 'integer', value: startProtocolFee },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount}__${setAmount}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 31, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 25 / 10000, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 19 / 100, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const startBalance3 = await getAssetBalance(token3, user, env.network);
    const startBalance4 = await getAssetBalance(token4, user, env.network);
    await step('swap', async () => {
      await swap(token2.assetId, 1, [{ assetId: token4.assetId, amount: exchangeAmount * weight / 100 }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 + exchangeAmount * weight / 10000 - Math.floor(exchangeAmount * 0.1 * weight / 10000));
      expect(await getAssetBalance(token1, user, env.network))
        .to.be.equal(startBalance1);
      expect(await getAssetBalance(token3, user, env.network))
        .to.be.equal(startBalance3);
      expect(await getAssetBalance(token4, user, env.network))
        .to.be.equal(startBalance4 - exchangeAmount * weight / 100);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(token1, contract, env.network))
        .to.be.equal(setAmount * 31);
      expect(await getAssetContractBalance(token2, contract, env.network))
        .to.be.equal(setAmount * 25 / 10000 - exchangeAmount * weight / 10000 + Math.floor(exchangeAmount * 0.1 * weight / 10000));
      expect(await getAssetContractBalance(token3, contract, env.network))
        .to.be.equal(setAmount * 25 );
      expect(await getAssetContractBalance(token4, contract, env.network))
        .to.be.equal(setAmount * 19 / 100 + exchangeAmount * weight / 100);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token2.assetId}`, env.network))
        .to.be.equal(startLpFee + Math.floor(exchangeAmount * 0.06 * weight / 100));
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token2.assetId}`, env.network))
        .to.be.equal(startProtocolFee + Math.floor(exchangeAmount * 0.04 * weight / 100));
      expect(await getDataValue(contract, `LP_FEE__${token1.assetId}`, env.network)).to.be.equal(0);
      expect(await getDataValue(contract, `LP_FEE__${token4.assetId}`, env.network)).to.be.equal(0);
      expect(await getDataValue(contract, `LP_FEE__${token3.assetId}`, env.network)).to.be.equal(0);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token1.assetId}`, env.network)).to.be.equal(0);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token4.assetId}`, env.network)).to.be.equal(0);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token3.assetId}`, env.network)).to.be.equal(0);
    });
    await step('check balances in state', async () => {
      expect(await getDataValue(contract, 'ASSET_BALANCES', env.network))
        .to.be.equal(`${setAmount * 31 / 100}__${setAmount * 25 / 100 - exchangeAmount * weight / 100}__${setAmount * 25 / 100}__${setAmount * 19 / 100 + exchangeAmount * weight / 100}`);
    });
  });

  it('swap, real balances different than state balances', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    const setAmount = exchangeAmount;
    const weight = 4;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__${setAmount * 100}__60000__40000__200000__0__0__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${setAmount * 25}__${setAmount * 25}__${setAmount * 25}__${setAmount * 25}` },
            { key: 'TOTAL_LP', type: 'integer', value: setAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${setAmount * 100}__${setAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 31, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 25, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, setAmount * 19, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const startBalance3 = await getAssetBalance(token3, user, env.network);
    const startBalance4 = await getAssetBalance(token4, user, env.network);
    await step('swap', async () => {
      await swap(token1.assetId, 1, [{ assetId: token2.assetId, amount: exchangeAmount * weight }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 - exchangeAmount * weight);
      expect(await getAssetBalance(token1, user, env.network))
        .to.be.equal(startBalance1 + exchangeAmount * weight - Math.floor(exchangeAmount * 0.1 * weight));
      expect(await getAssetBalance(token3, user, env.network))
        .to.be.equal(startBalance3);
      expect(await getAssetBalance(token4, user, env.network))
        .to.be.equal(startBalance4);
    });
    await step('check contract balances', async () => {
      expect(await getAssetContractBalance(token1, contract, env.network))
        .to.be.equal(setAmount * 31 - exchangeAmount * weight + Math.floor(exchangeAmount * 0.1 * weight));
      expect(await getAssetContractBalance(token2, contract, env.network))
        .to.be.equal(setAmount * 25 + exchangeAmount * weight);
      expect(await getAssetContractBalance(token3, contract, env.network))
        .to.be.equal(setAmount * 25);
      expect(await getAssetContractBalance(token4, contract, env.network))
        .to.be.equal(setAmount * 19);
    });
    await step('check balances in state', async () => {
      expect(await getDataValue(contract, 'ASSET_BALANCES', env.network))
        .to.be.equal(`${setAmount * 25 - exchangeAmount * weight}__${setAmount * 25 + exchangeAmount * weight}__${setAmount * 25}__${setAmount * 25}`);
    });
  });

  it('swap in point B with equal decimals', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const w = 6;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__0__50000__50000__1000000__200000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const addFee = 2 * Math.floor(exchangeAmount * 0.002 * (w - 5));
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    await step('swap', async () => {
      await swap(token2.assetId, 1, [{ assetId: token1.assetId, amount: exchangeAmount * w }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token1, user, env.network))
        .to.be.equal(startBalance1 - exchangeAmount * w);
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 + exchangeAmount * w - addFee - lpFee - protocolFee);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token2.assetId}`, env.network))
        .to.be.equal(lpFee);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token2.assetId}`, env.network))
        .to.be.equal(protocolFee);
    });
  });

  it('swap source token behind B and target token below B', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const w = 2;
    const amplifier = 200000;
    const slipRate = 70000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__0__50000__50000__1000000__${amplifier}__${slipRate}__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 35}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 35, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token4.assetId);
    });
    const startBalance3 = await getAssetBalance(token3, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const eq = getEquilibrium(exchangeAmount * 110, 25, 100);
    const th = getThreshold(eq, 1000000 + amplifier);
    const prevBal = exchangeAmount * 35;
    const prevDev = th > prevBal ? th - prevBal : prevBal - th;
    const prevFee = getTokenFee(eq, prevDev, slipRate);
    const bal = exchangeAmount * (35 + w);
    const dev = th > bal ? th - bal : bal - th;
    const fee = getTokenFee(eq, dev, slipRate);
    const addFee = fee - prevFee;
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    await step('swap', async () => {
      await swap(token2.assetId, 1, [{ assetId: token3.assetId, amount: exchangeAmount * w }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token3, user, env.network))
        .to.be.equal(startBalance3 - exchangeAmount * w);
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 + exchangeAmount * w - addFee - lpFee - protocolFee);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token2.assetId}`, env.network))
        .to.be.equal(lpFee);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token2.assetId}`, env.network))
        .to.be.equal(protocolFee);
    });
  });

  // REFACTOR IT!!! (check fees)
  xit('swap with 2 repeats of fee calculation', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 100000000;
    const w = 10;
    const amplifier = 200000;
    const slipRate = 70000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__0__50000__50000__1000000__${amplifier}__${slipRate}__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token4.assetId);
    });
    const startBalance3 = await getAssetBalance(token3, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const eq = getEquilibrium(exchangeAmount * 100, 25, 100);
    const th = getThreshold(eq, 1000000 + amplifier);
    const bal1 = exchangeAmount * (25 + w);
    const dev1 = th > bal1 ? th - bal1 : bal1 - th;
    const fee1 = getTokenFee(eq, dev1, slipRate);
    const newAmt = exchangeAmount * w - fee1;
    const bal2 = exchangeAmount * 25 + newAmt;
    const dev2 = th > bal2 ? th - bal2 : bal2 - th;
    const fee2 = getTokenFee(eq, dev2, slipRate);
    const addFee = fee2 * 2;
    console.info('bal1: ', bal1);
    console.info('fee1: ', fee1);
    console.info('bal2: ', bal2);
    console.info('fee2: ', fee2);
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    await step('swap', async () => {
      await swap(token2.assetId, 1, [{ assetId: token3.assetId, amount: exchangeAmount * w }], user);
    });
    // await step('check balances', async () => {
    //   expect(await getAssetBalance(token3, user, env.network))
    //     .to.be.equal(startBalance3 - exchangeAmount * w);
    //   expect(await getAssetBalance(token2, user, env.network))
    //     .to.be.equal(startBalance2 + exchangeAmount * w - addFee - lpFee - protocolFee);
    // });
    // await step('check fees', async () => {
    //   expect(await getDataValue(contract, `LP_FEE__${token2.assetId}`, env.network))
    //     .to.be.equal(lpFee);
    //   expect(await getDataValue(contract, `PROTOCOL_FEE__${token2.assetId}`, env.network))
    //     .to.be.equal(protocolFee);
    // });
  });

  it('swap with feeMaxRate_ limit', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const w = 6;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__0__50000__50000__1000000__200000__50000__1000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const addFee = 2 * Math.floor(exchangeAmount * 0.001 * (w - 5));
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    await step('swap', async () => {
      await swap(token2.assetId, 1, [{ assetId: token1.assetId, amount: exchangeAmount * w }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token1, user, env.network))
        .to.be.equal(startBalance1 - exchangeAmount * w);
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 + exchangeAmount * w - addFee - lpFee - protocolFee);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token2.assetId}`, env.network))
        .to.be.equal(lpFee);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token2.assetId}`, env.network))
        .to.be.equal(protocolFee);
    });
  });

  it('swap in point B with different decimals', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('SPEC2', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('SPECLP2', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const w = 6;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token3.assetId}__1__0__50000__50000__1000000__200000__50000__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token2.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25 / 10000, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25 / 100, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const addFee = 2 * Math.floor(exchangeAmount * 0.002 * (w - 5));
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.05);
    await step('swap', async () => {
      await swap(token2.assetId, 1, [{ assetId: token1.assetId, amount: exchangeAmount * w }], user);
    });
    await step('check balances', async () => {
      expect(await getAssetBalance(token1, user, env.network))
        .to.be.equal(startBalance1 - exchangeAmount * w);
      expect(await getAssetBalance(token2, user, env.network))
        .to.be.equal(startBalance2 + exchangeAmount * w / 10000 - Math.floor(addFee / 10000) - Math.floor(lpFee / 10000) - Math.floor(protocolFee / 10000) - 3); // 3 - `just correct rounds
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token2.assetId}`, env.network))
        .to.be.equal(lpFee);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token2.assetId}`, env.network))
        .to.be.equal(protocolFee);
    });
  });

  it('swap from B-D to C-E with negative fee', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const w = 21;
    const amplifier = 200000;
    const slipRate = 50000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__0__1000__1000__1000000__${amplifier}__${slipRate}__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 40}__${exchangeAmount * 10}__${exchangeAmount * 25}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 40, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 10, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const eq = getEquilibrium(exchangeAmount * 100, 25, 100);
    const th1 = getThreshold(eq, 1000000 + amplifier);
    const th2 = getThreshold(eq, 1000000 - amplifier);
    const prevBal1 = exchangeAmount * 40;
    const prevDev1 = th1 > prevBal1 ? th1 - prevBal1 : prevBal1 - th1;
    const prevFee1 = getTokenFee(eq, prevDev1, slipRate);
    const bal1 = exchangeAmount * (40 - w);
    const dev1 = th2 > bal1 ? th2 - bal1 : bal1 - th2;
    const fee1 = getTokenFee(eq, dev1, slipRate);
    const addFee1 = fee1 - prevFee1;
    const prevBal2 = exchangeAmount * 10;
    const prevDev2 = th2 > prevBal2 ? th2 - prevBal2 : prevBal2 - th2;
    const prevFee2 = getTokenFee(eq, prevDev2, slipRate);
    const bal2 = exchangeAmount * (10 + w);
    const dev2 = th1 > bal2 ? th1 - bal2 : bal2 - th1;
    const fee2 = getTokenFee(eq, dev2, slipRate);
    const addFee2 = fee2 - prevFee2;
    const addFee = addFee1 + addFee2;
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.001);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.001);
    await step('swap', async () => {
      await swap(token1.assetId, 1, [{ assetId: token2.assetId, amount: exchangeAmount * w }], user);
    });
    await step('check balances', async () => {
      const currBal1 = await getAssetBalance(token1, user, env.network);
      const currBal2 = await getAssetBalance(token2, user, env.network);
      expect(currBal2).to.be.equal(startBalance2 - exchangeAmount * w);
      expect(currBal1).to.be.equal(startBalance1 + exchangeAmount * w - addFee - lpFee - protocolFee);
      expect(startBalance1 + startBalance2).is.lessThan(currBal1 + currBal2);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token1.assetId}`, env.network))
        .to.be.equal(lpFee);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token1.assetId}`, env.network))
        .to.be.equal(protocolFee);
    });
  });

  // Refactor it (check fee)
  xit('swap from B-D to A-B with negative fee', async () => {
    const contract = getContractByName('crosschain_swap', this.parent?.ctx);
    const techContract = getContractByName('technical', this.parent?.ctx);
    const user = getAccountByName('neo', this.parent?.ctx);
    const techUser = getAccountByName('tech_acc', this.parent?.ctx);
    const token1 = getAssetByName('NAME4', this.parent?.ctx);
    const token2 = getAssetByName('NAME5', this.parent?.ctx);
    const token3 = getAssetByName('NAME6', this.parent?.ctx);
    const token4 = getAssetByName('NAME7', this.parent?.ctx);
    const exchangeAmount = 1000000;
    const w = 11;
    const amplifier = 200000;
    const slipRate = 50000;
    await step('set state', async () => {
      await setContractState(
        {
          data: [
            { key: 'STORAGE', type: 'string', value: `${token4.assetId}__1__0__1000__1000__1000000__${amplifier}__${slipRate}__100000__${techContract.dApp}` },
            { key: 'ASSETS', type: 'string', value: `${token1.assetId}__${token2.assetId}__${token3.assetId}__${token4.assetId}` },
            { key: 'ASSET_WEIGHTS', type: 'string', value: '25__25__25__25' },
            { key: 'ASSET_BALANCES', type: 'string', value: `${exchangeAmount * 40}__${exchangeAmount * 10}__${exchangeAmount * 25}__${exchangeAmount * 25}` },
            { key: `LP_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: `PROTOCOL_FEE__${token1.assetId}`, type: 'integer', value: 0 },
            { key: 'TOTAL_LP', type: 'integer', value: exchangeAmount * 100 },
            { key: 'SIGMA_FEE_PER_LP', type: 'string', value: `${exchangeAmount * 100}__${exchangeAmount * 100}__0__0__0__0__0__0__0__0__0` },
          ]
        },
        { privateKey: contract.privateKey },
        env.network
      );
    });
    await step('normalize balances', async () => {
      if (await getAssetContractBalance(token1, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token1);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 40, token1.assetId);
      if (await getAssetContractBalance(token2, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token2);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 10, token2.assetId);
      if (await getAssetContractBalance(token3, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token3);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token3.assetId);
      if (await getAssetContractBalance(token4, contract, env.network) > 0) {
        await dropBalanceDen(techUser, token4);
      }
      await sendMoneyToContract(techUser, contract, exchangeAmount * 25, token4.assetId);
    });
    const startBalance1 = await getAssetBalance(token1, user, env.network);
    const startBalance2 = await getAssetBalance(token2, user, env.network);
    const eq = getEquilibrium(exchangeAmount * 100, 25, 100);
    const th1 = getThreshold(eq, 1000000 + amplifier);
    const th2 = getThreshold(eq, 1000000 - amplifier);
    const prevBal1 = exchangeAmount * 40;
    const prevDev1 = th1 > prevBal1 ? th1 - prevBal1 : prevBal1 - th1;
    const prevFee1 = getTokenFee(eq, prevDev1, slipRate);
    const bal1 = exchangeAmount * (40 - w);
    const dev1 = th1 > bal1 ? th1 - bal1 : bal1 - th1;
    const fee1 = getTokenFee(eq, dev1, slipRate);
    const addFee1 = fee1 - prevFee1;
    const prevBal2 = exchangeAmount * 10;
    const prevDev2 = th2 > prevBal2 ? th2 - prevBal2 : prevBal2 - th2;
    const prevFee2 = getTokenFee(eq, prevDev2, slipRate);
    const bal2 = exchangeAmount * (10 + w);
    const dev2 = th2 > bal2 ? th2 - bal2 : bal2 - th2;
    const fee2 = getTokenFee(eq, dev2, slipRate);
    const addFee2 = fee2 - prevFee2;
    const addFee = addFee1 + addFee2;
    const lpFee = Math.floor((exchangeAmount * w - addFee) * 0.001);
    const protocolFee = Math.floor((exchangeAmount * w - addFee) * 0.001);
    await step('swap', async () => {
      await swap(token1.assetId, 1, [{ assetId: token2.assetId, amount: exchangeAmount * w }], user);
    });
    await step('check balances', async () => {
      const currBal1 = await getAssetBalance(token1, user, env.network);
      const currBal2 = await getAssetBalance(token2, user, env.network);
      expect(currBal2).to.be.equal(startBalance2 - exchangeAmount * w);
      expect(currBal1).to.be.equal(startBalance1 + exchangeAmount * w - addFee - lpFee - protocolFee);
      expect(startBalance1 + startBalance2).is.lessThan(currBal1 + currBal2);
    });
    await step('check fees', async () => {
      expect(await getDataValue(contract, `LP_FEE__${token1.assetId}`, env.network))
        .to.be.equal(lpFee);
      expect(await getDataValue(contract, `PROTOCOL_FEE__${token1.assetId}`, env.network))
        .to.be.equal(protocolFee);
    });
  });

  // -------------------------------------------------------------------------
  // ADVANCED TESTS (is it need?)


  // разбалансировка пула на 3-х токенах (4-х токенах) при помощи slippage
  // своп, 10 токенов, 2 для обмена с ненулевыми балансами, остальные = 0, (.) Е (обмен по парам с приемлемым балансом)
  // check _validateSwapInvariant: revert

});


