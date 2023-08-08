import { getAccountByName, getAssetByName, getContractByName, getDataValue, setContractState } from '@pepe-team/waves-sc-test-utils';
import { setSignedContext } from '../../steps/common';
import { step, stepCatchError, stepIgnoreErrorByMessage } from 'relax-steps-allure';
import { getEnvironment } from 'relax-env-json';
import { burn, collect, flipTick, init, mint, swap } from '../../steps/swap';
import { expect } from 'chai';
const env = getEnvironment();

/**
 * BUGS:    2) [SWAP][NORMAL] Recipient address doesn't checked in swap() function
 *          3) [SWAP][CRITICAL] "Error while executing dApp: Input string size = 2000 bytes exceeds limit = 500 for split" in swap() function
 *          4) [SWAP][NORMAL] Have no bigInt sqrtPrice error handling in swap() function
 *          5) [SWAP][MAJOR] have no payment check in swap() function
 *          6) [MINT][MAJOR] Wrong payment check in mint() function
 * 
 * MEMO:    1) Must we add multisig verification for swap contract?
 *          2) Move up all literal parts of state variables
 * 
 * SOLVED:  1) Divizion by zero line 518 (max liquidity per tick calc)
 */
describe('Swap component', function () {
  xdescribe('[private section]', function () {
    describe('flipTick tests', function () {
      it('should throw when caller is not contract', async () => {
        const contract = getContractByName('concentrated_swap', this.parent?.ctx);
        const user = getAccountByName('neo', this.parent?.ctx);
        await step('set state', async () => {
          await setContractState(
            {
              data: [
                { key: 'TICK_IDX_ROOT', type: 'string', value: '' }
              ]
            },
            { privateKey: contract.privateKey },
            env.network
          );
        });
        await stepIgnoreErrorByMessage(
          'try to flip tick',
          'Error while executing dApp: only this contract',
          async () => {
            // max tick = 414486, tick index size = 1000
            await flipTick(123, user); // tick, 
          }
        );
        await step('check state', async () => {
          expect(await getDataValue(contract, 'TICK_IDX_ROOT', env.network)).is.empty;
        });
      });

      it('positive case with no init ticks in word (1 or 1)', async () => {
        const contract = getContractByName('concentrated_swap', this.parent?.ctx);
        const user = getAccountByName('neo', this.parent?.ctx);
        await step('set state', async () => {
          await setContractState(
            {
              data: [
                { key: 'TICK_IDX_ROOT', type: 'string', value: '' },
                // TICK_IDX__
                { key: 'TICK_IDX__415', type: 'string', value: '' },
              ]
            },
            { privateKey: contract.privateKey },
            env.network
          );
        });
        await step('flip tick', async () => {
          // max tick = 414486, tick index size = 1000
          await flipTick(415); // tick, 
        });
        await step('check state', async () => {
          expect(await getDataValue(contract, 'TICK_IDX_ROOT', env.network)).is.empty;
        });
      });

      xit('positive case when used root tick', async () => {});
    });

    xdescribe('crossTick tests', function () {
      it('should throw when caller is not contract', async () => {});

      it('simple positive', async () => {});
    });

    xdescribe('updateTick tests', function () {
      it('should throw when caller is not contract', async () => {});

      it('simple positive', async () => {});
    });
  });

  describe('init tests', function () {
    it.only('should throw when caller is initialized with second token', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'token1____0__0__0__0__0__1__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await step(//IgnoreErrorByMessage(
        'try to init',
        // 'Error while executing dApp: _whenNotInitialized: revert',
        async () => {
          await init(0, 'token1', 'token2', 1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when caller is initialized with first token', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = '__token2__0__0__0__0__0__1__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: _whenNotInitialized: revert',
        async () => {
          await init(0, 'token1', 'token2', 1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when both of tokens are not empty', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'token1__token2__0__0__0__0__0__1__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: _whenNotInitialized: revert',
        async () => {
          await init(0, 'token1', 'token2', 1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when tick is too low', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid tick',
        async () => {
          await init(-414487, 'token1', 'token2', 1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when tick is too high', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid tick',
        async () => {
          await init(414487, 'token1', 'token2', 1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when token0 is invalid', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid token0',
        async () => {
          await init(-414486, '', 'token2', 1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when token1 is invalid', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const pseudoToken = getAccountByName('trinity', this.parent?.ctx);
      const sender = getAccountByName('neo', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid token1',
        async () => {
          await init(414486, usdn.assetId, pseudoToken.address, 1, 2, 3, sender); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when lpFeeRate less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid lp fee',
        async () => {
          await init(414486, usdn.assetId, 'waves', -1, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when lpFeeRate more than 100%', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid lp fee',
        async () => {
          await init(9, usdn.assetId, 'waves', 1000001, 2, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when protocolFeeRate less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid protocol fee',
        async () => {
          await init(414486, usdn.assetId, 'waves', 0, -1, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when protocolFeeRate more than 100%', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid protocol fee',
        async () => {
          await init(414486, usdn.assetId, 'waves', 1000000, 1000001, 3); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when tickSpacing less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid tickSpacing',
        async () => {
          await init(414486, usdn.assetId, 'waves', 0, 0, -1); // tick, 
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    it('should throw when protocolFeeRate more than 100%', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = '____0__0__0__0__0__0__0__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to init',
        'Error while executing dApp: init: invalid tickSpacing',
        async () => {
          await init(414486, usdn.assetId, 'waves', 0, 1000000, 414486 * 2 + 1);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network)).to.be.equal(initState);
      });
    });

    /**
     * BUG! Divizion by zero line 518 (max liquidity per tick calc)
     */
    xit('simple positive', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: '____0__0__0__0__0__0__0__0__0__0__0__0' }
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await step('init', async () => {
        await init(0, usdn.assetId, 'waves', 0, 0, 0);
      });
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(`waves__${usdn.assetId}__0__0__0__0__0__1__0__0__0__0__0}`);
      });
    });
  });

  // TODO: refactor tests with payments
  describe('mint tests', function () {
    it('should throw when recipient address is empty', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid recipient',
        async () => {
          await mint('', -100, 90, 1);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when recipient address is wrong', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid recipient',
        async () => {
          await mint('abc123', -100, 90, 1);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower > tickUpper', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid ticks: L>U',
        async () => {
          await mint(user.address, 1, -1, 1366);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower == tickUpper', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid ticks: L>U',
        async () => {
          await mint(user.address, 0, 0, 1366);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower less than tick min', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid ticks: L<M',
        async () => {
          await mint(user.address, -414487, -1, 1366);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickUpper more than tick max', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid ticks: U>M',
        async () => {
          await mint(user.address, 414486, 414487, 1366, [], user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when amount less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: mint: invalid amount',
        async () => {
          await mint(user.address, -414486, 414486, -1, [], user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    // BUG!!!
    xit('should throw when empty payment', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await step(//IgnoreErrorByMessage(
        'mint',
        // 'Error while executing dApp: not enough payments',
        async () => {
          await mint(user.address, -100, 100, 1366, [], user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
    });

    // BUG (the same previous)
    xit('should throw when payment has only one token', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to mint',
        'Error while executing dApp: not enough payments',
        async () => {
          await mint(user.address, -100, 100, 1366, [{ assetId: null, amount: 1366 }], user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
    });

    /**
     * REFACTOR IT!!!
     */
    xit('should throw when payment has three tokens', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const weth = getAssetByName('WETH', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await step(//IgnoreErrorByMessage(
        'try to mint',
        // 'Error while executing dApp: not enough payments',
        async () => {
          await mint(
            user.address,
            -100,
            100,
            1366,
            [
              { assetId: usdn.assetId, amount: 1366 },
              { assetId: null, amount: 1366 },
              { assetId: weth.assetId, amount: 0 }
            ]
          );
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
    });

    it('should throw when assetId #0 is wrong', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await step(//IgnoreErrorByMessage(
        'try to mint',
        // 'Error while executing dApp: wrong token0',
        async () => {
          await mint(
            user.address,
            -100,
            100,
            1366,
            [
              { assetId: null, amount: 1366 },
              { assetId: usdn.assetId, amount: 1366 },
            ]
          );
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
    });

    it('should throw when assetId #1 is wrong', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'mint',
        'Error while executing dApp: wrong token1',
        async () => {
          await mint(
            user.address,
            -100,
            100,
            1366,
            [
              { assetId: usdn.assetId, amount: 1366 },
              { assetId: usdn.assetId, amount: 1366 },
            ]
          );
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
    });

    it('should throw when both assetIds are wrong', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'mint',
        'Error while executing dApp: wrong token0',
        async () => {
          await mint(
            user.address,
            -100,
            100,
            1366,
            [
              { assetId: null, amount: 1366 },
              { assetId: usdn.assetId, amount: 1366 },
            ]
          );
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
    });

    /**
     * TODO: check when one of amounts can be = 0
     */

    // REFACTOR IT!!!
    xit('should throw when amount0 is wrong', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      const payment = [
        { assetId: null, amount: 1366 },
        { assetId: null, amount: 1366 },
      ];
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await step(//IgnoreErrorByMessage(
        'try to mint',
        // 'Error while executing dApp: insufficient amount0',
        async () => {
          await mint(
            user.address,
            -100,
            100,
            1366,
            payment
          );
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
      await step('check payment', async () => {
        expect(payment[0].amount).is.equal(1366);
        expect(payment[1].amount).is.equal(1366);
      });
    });

    it('should throw when amount1 is wrong', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      const payment = [
        { assetId: null, amount: 1366 },
        { assetId: null, amount: 1366 },
      ];
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'mint',
        'Error while executing dApp: insufficient amount1',
        async () => {
          await mint(
            user.address,
            -100,
            100,
            1366,
            payment
          );
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .is.equal(initState);
      });
      await step('check payment', async () => {
        expect(payment[0].amount).is.equal(1366);
        expect(payment[1].amount).is.equal(1366);
      });
    });

    // TODO
    xit('simple positive', async () => {});
  });

  describe('burn tests', function () {
    it('should throw when tickLower > tickUpper', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to burn',
        'Error while executing dApp: burn: invalid ticks: L>U',
        async () => {
          await burn(1, -1, 1366);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower == tickUpper', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to burn',
        'Error while executing dApp: burn: invalid ticks: L>U',
        async () => {
          await burn(0, 0, 1366);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower less than tick min', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to burn',
        'Error while executing dApp: burn: invalid ticks: L<M',
        async () => {
          await burn(-414487, -1, 1366);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickUpper more than tick max', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      const user = getAccountByName('neo', this.parent?.ctx);
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to burn',
        'Error while executing dApp: burn: invalid ticks: U>M',
        async () => {
          await burn(414486, 414487, 1366, user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    // REFACTOR IT!!!
    xit('should throw when amount less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to `burn`',
        'Error while executing dApp: burn: invalid amount',
        async () => {
          await burn(-414486, 414486, -1, user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    // TODO
    xit('should throw when needed token #1', async () => {});

    // TODO
    xit('should throw when needed token #2', async () => {});

    // TODO
    xit('simple positive', async () => {});
  });

  describe('collect tests', function () {
    it('should throw when invalid recipient', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      // const user = getAccountByName('neo', this.parent?.ctx);
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid recipient',
        async () => {
          await collect('', 1366, 1366, 1366, 1366);
        }
      );
    });

    it('should throw when tickLower > tickUpper', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid ticks: L>U',
        async () => {
          await collect(user.address, 1, -1, 1366, 1488);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower == tickUpper', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid ticks: L>U',
        async () => {
          await collect(user.address, 0, 0, 1366, 1488);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickLower less than tick min', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid ticks: L<M',
        async () => {
          await collect(user.address, -414487, -1, 1366, 1488);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when tickUpper more than tick max', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      const user = getAccountByName('neo', this.parent?.ctx);
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid ticks: U>M',
        async () => {
          await collect(user.address, 414486, 414487, 1366, 1488, user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when amount0 less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      const user = getAccountByName('neo', this.parent?.ctx);
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid amount0',
        async () => {
          await collect(user.address, -414486, 414486, -1, 1488);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when amount1 less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const initState = 'waves__usdn__0__0__0__0__0__1__0__0__0__0__0';
      const user = getAccountByName('neo', this.parent?.ctx);
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to collect',
        'Error while executing dApp: collect: invalid amount1',
        async () => {
          await collect(user.address, -414486, 414486, 1, -1);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    // TODO
    xit('simple positive', async () => {});
  });

  describe('swap tests', function () {
    // BUG x2 !!!
    xit('should throw when wrong recipient address', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      const isError = await stepCatchError(
        'try to swap',
        async () => {
          await swap(user.address, false, 0, '1', [{ assetId: null, amount: 1366 }], user);
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
      await step('check error', async () => {
        expect(isError).to.be.true;
      });
    });

    it('should throw when sqrt price string is hex', async () => {
      // const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const isError = await stepCatchError(
        'try to swap',
        async () => {
          await swap(user.address, false, 0, '0x123');
        }
      );
      await step('check error', async () => {
        expect(isError).to.be.true;
      });
    });

    it('should throw when sqrt price string is literal string', async () => {
      // const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const isError = await stepCatchError(
        'try to swap',
        async () => {
          await swap(user.address, false, 0, 'aa');
        }
      );
      await step('check error', async () => {
        expect(isError).to.be.true;
      });
    });

    it('should throw when sqrt price string is empty', async () => {
      // const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const isError = await stepCatchError(
        'try to swap',
        async () => {
          await swap(user.address, false, 0, '');
        }
      );
      await step('check error', async () => {
        expect(isError).to.be.true;
      });
    });

    // Is amountSpecified_ can be less than 0?
    it('should throw when amountSpecified_ more than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to swap',
        'Error while executing dApp: invalid amount',
        async () => {
          await swap(user.address, false, 1, '1');
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when amountSpecified_ less than 0', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to swap',
        'Error while executing dApp: invalid amount',
        async () => {
          await swap(user.address, false, -1, '1');
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when amountSpecified_ more than 0 and zeroForOne_ is true', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to swap',
        'Error while executing dApp: invalid amount',
        async () => {
          await swap(user.address, true, 1, '123');
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when sqrtPriceLimitX96 more than price', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to swap',
        'Error while executing dApp: q',
        async () => {
          await swap(user.address, true, 0, '1000000000000000001');
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    it('should throw when sqrtPriceLimitX96 less than 1', async () => {
      const contract = getContractByName('concentrated_swap', this.parent?.ctx);
      const user = getAccountByName('neo', this.parent?.ctx);
      const usdn = getAssetByName('USDN', this.parent?.ctx);
      const initState = `${usdn.assetId}__waves__1__11126263505391__0__1000000000000000000__0__1__0__0__0__0__0__0`;
      await step('set state', async () => {
        await setContractState(
          {
            data: [
              { key: 'STORAGE', type: 'string', value: initState },
            ]
          },
          { privateKey: contract.privateKey },
          env.network
        );
      });
      await stepIgnoreErrorByMessage(
        'try to swap',
        'Error while executing dApp: q',
        async () => {
          await swap(user.address, true, 0, '0');
        }
      );
      await step('check state', async () => {
        expect(await getDataValue(contract, 'STORAGE', env.network))
          .to.be.equal(initState);
      });
    });

    // TODO: AFTER REFACTORING!!!
    xit('should throw when have no payment', async () => {});
  });
});