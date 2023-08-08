import {
    Account,
    Asset,
    Contract,
    getAccountByName,
    getAssetByName,
    getContractByName,
    getDataValue, setContractState
} from "@pepe-team/waves-sc-test-utils";
import {init} from "../../steps/crosschain.swap";
import {step, stepIgnoreErrorByMessage} from "relax-steps-allure";
import {expect} from 'chai';
import {getEnvironment} from "relax-env-json";
import {convertList2MapList, outConsoleOrAllure, parseSTORAGE} from "./helpers/helper";
import {describe} from "mocha";
const env=getEnvironment();

const key_ASSETS='ASSETS';
const key_ASSET_BALANCES='ASSET_BALANCES';
const key_ASSET_WEIGHTS='ASSET_WEIGHTS';
const key_STORAGE='STORAGE';
const defaultState_ASSETS = '';
const defaultState_ASSET_WEIGHTS = '';
const defaultState_STORAGE = '__0__0__0__0__0__0__0__0__3M3iPZv1iVEUjLXLJv5RFCmZhgmkfkkg3uP';
let SEP = "__"
let WAVES = "waves"
let MAX_INT = 9223372036854775807n // 2^63 - 1
let MAX_FEE = 1000000
let MAX_AMPLIFIER = 1000000
let MAX_WEIGHT_AMPLIFIER = 1000000
let MAX_WEIGHT = 1000000
let SLIPPAGE_RATE_FACTOR = 1000000
let FEE_RATE_FACTOR = 1000000
let RATE_FACTOR = 1000000
let PERCENT_FACTOR = 1000000000000n
let INT_DECIMALS = 8
let BIGINT_DECIMALS = 18
let LIST_32 = "0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0".split("_")

let protocolFeeContract:Account;

describe('Testing init function: ', function () {
    let contract:Contract;
    let [a1, a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22]:Asset[]=[];
    let sender:Account;
    beforeEach(async () => {
        contract = getContractByName('crosschain_swap', this.parent?.ctx);
        a1 = getAssetByName('USDN', this.parent?.ctx);
        a2 = getAssetByName('WBTC', this.parent?.ctx);
        a3 = getAssetByName('WETH', this.parent?.ctx);
        a4 = getAssetByName('NAME4', this.parent?.ctx);
        a5 = getAssetByName('NAME5', this.parent?.ctx);
        a6 = getAssetByName('NAME6', this.parent?.ctx);
        a7 = getAssetByName('NAME7', this.parent?.ctx);
        a8 = getAssetByName('NAME8', this.parent?.ctx);
        a9 = getAssetByName('NAME9', this.parent?.ctx);
        a10 = getAssetByName('NAME10', this.parent?.ctx);
        a11 = getAssetByName('NAME11', this.parent?.ctx);
        a12 = getAssetByName('NAME12', this.parent?.ctx);
        a13 = getAssetByName('NAME13', this.parent?.ctx);
        a14 = getAssetByName('NAME14', this.parent?.ctx);
        a15 = getAssetByName('NAME15', this.parent?.ctx);
        a16 = getAssetByName('NAME16', this.parent?.ctx);
        a17 = getAssetByName('NAME17', this.parent?.ctx);
        a18 = getAssetByName('NAME18', this.parent?.ctx);
        a19 = getAssetByName('NAME19', this.parent?.ctx);
        a20 = getAssetByName('NAME20', this.parent?.ctx);
        a21 = getAssetByName('NAME21', this.parent?.ctx);
        a22 = getAssetByName('NAME22', this.parent?.ctx);
        sender = getAccountByName('neo', this.parent?.ctx);
        protocolFeeContract = getAccountByName('manager', this.parent?.ctx);
        await step('set default state', async () => {
            await setContractState(
                {
                    data: [
                        {key: key_STORAGE, type: 'string', value: defaultState_STORAGE},//check this!!!! may be incorrect...
                        {key: key_ASSET_WEIGHTS, type: 'string', value: defaultState_ASSET_WEIGHTS},
                        {key: key_ASSETS, type: 'string', value: defaultState_ASSETS}
                    ]
                },
                {privateKey: contract.privateKey},
                env.network
            );
        });
    })
    describe('testing params assets and assetWeight: ', function () {
        it('[+] should correct init with params not zero', async () => {
            outConsoleOrAllure('protocolFeeContract.address: ',protocolFeeContract.address)
            await step('init', async () => {
                await init(
                    convertList2MapList([a1.assetId, a2.assetId]),
                    convertList2MapList(['1', '2']),
                    1,
                    1,
                    'pepeToken',
                    'pepe Reward Token',
                    1,
                    1,
                    1,
                    1,
                    1,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
        });
        it('[+] param assets and assetWeight are 10 items', async () => {
            await step('try to init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId,a3.assetId,a4.assetId,a5.assetId,a6.assetId,
                            a7.assetId,a8.assetId,a9.assetId,a10.assetId]),
                        convertList2MapList(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        0,
                        0,
                        0,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}__${a3.assetId}__${a4.assetId}__${a5.assetId}__`+
                `${a6.assetId}__${a7.assetId}__${a8.assetId}__${a9.assetId}__${a10.assetId}`;
            const expectedASSET_WEIGHTS =
                `1__2__3__4__5__6__7__8__9__10`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
        })
        it('[-] param assets and assetWeight are more 10 items', async () => {
            await stepIgnoreErrorByMessage('try to init',
                'Error while executing dApp: List size exceeds 10',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId,a3.assetId,a4.assetId,a5.assetId,a6.assetId,
                            a7.assetId,a8.assetId,a9.assetId,a10.assetId,a11.assetId, a12.assetId,a13.assetId,a14.assetId,
                            a15.assetId,a16.assetId,a17.assetId,a18.assetId,a19.assetId,a20.assetId,a21.assetId]),
                        convertList2MapList(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
                            '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        0,
                        0,
                        0,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        })
        it('[+] param assets and assetWeight are 0 items', async () => {
            await step('try to init', async () => {
                await init(
                    convertList2MapList([]),
                    convertList2MapList([]),
                    0,
                    0,
                    'pepeToken',
                    'pepe Reward Token',
                    0,
                    0,
                    0,
                    0,
                    0,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
        });
        it('[-] invalid name asset', async () => {
            await stepIgnoreErrorByMessage('try to init',
                'Error while executing dApp: init: invalid assets',
                async () => {
                    await init(
                        convertList2MapList(['qwrewrewrt', a2.assetId]),
                        convertList2MapList(['1', '2']),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        0,
                        0,
                        0,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[+] weight is MAX_WEIGHT', async () => {
            await step('init', async () => {
                await init(
                    convertList2MapList([a1.assetId, a2.assetId]),
                    convertList2MapList(['1', MAX_WEIGHT.toString()]),
                    1,
                    1,
                    'pepeToken',
                    'pepe Reward Token',
                    1,
                    1,
                    1,
                    1,
                    1,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS =
                `1__${MAX_WEIGHT.toString()}`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
        });
        it('[-] weight is more MAX_WEIGHT', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid assetWeights',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', (MAX_WEIGHT+1).toString()]),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] assets_.size() != assetWeights_.size()', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid assetWeights size',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2','3']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: lpFeeRate_: ', () => {
        it('[+] lpFeeRate_ is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        0,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.lpFeeRate).to.be.equal(0);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] lpFeeRate_ is MAX_FEE', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        MAX_FEE,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.lpFeeRate).to.be.equal(MAX_FEE);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] lpFeeRate_ is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid lp fee',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        -1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] lpFeeRate_ is more MAX_FEE', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid lp fee',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        MAX_FEE + 1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: protocolFeeRate: ', () => {
        it('[+] protocolFeeRate is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.protocolFeeRate).to.be.equal(0);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] protocolFeeRate is MAX_FEE', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        MAX_FEE,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.protocolFeeRate).to.be.equal(MAX_FEE);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] protocolFeeRate is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid protocol fee',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        -1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] protocolFeeRate is more MAX_FEE', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid protocol fee',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        MAX_FEE + 1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: tokenName: ', () => {
        it('[-] tokenName.size < 4', async () => {
            await stepIgnoreErrorByMessage('try to init',
                'Error while executing dApp: init: invalid name',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        0,
                        0,
                        'pep',
                        'pepe Reward Token',
                        0,
                        0,
                        0,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] tokenName.size > 16', async () => {
            await stepIgnoreErrorByMessage('try to init',
                'Error while executing dApp: init: invalid name',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        0,
                        0,
                        'pepePEPEpepePEPE1',
                        'pepe Reward Token',
                        0,
                        0,
                        0,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: tokenDescription: ', () => {
        it('[-] tokenDescription.size > 1000', async () => {
            await stepIgnoreErrorByMessage('try to init',
                'Error while executing dApp: init: invalid descr',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        0,
                        0,
                        'pepeToken',
                        'pepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardTokenpepeRewardToken',
                        0,
                        0,
                        0,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: lpTokenDecimals: ', () => {
        it('[+] lpTokenDecimals is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        0,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.lpAssetId).to.be.not.undefined;
                expect(storage.unlocked).to.be.equal('1');
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] lpTokenDecimals is 8', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.lpAssetId).to.be.not.undefined;
                expect(storage.unlocked).to.be.equal('1');
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] lpTokenDecimals is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid decimals',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        -1,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] lpTokenDecimals is more 8', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid decimals',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        9,
                        1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: maxAllocationAmplifier: ', () => {
        //weightAmplifier_ must be less maxAllocationAmplifier_
        it('[+] maxAllocationAmplifier is 0 and weightAmplifier is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        0,
                        0,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.maxAllocationAmplifier).to.be.equal(0);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] maxAllocationAmplifier is MAX_AMPLIFIER', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        MAX_AMPLIFIER,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.maxAllocationAmplifier).to.be.equal(MAX_AMPLIFIER);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] maxAllocationAmplifier is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid maxAllocationAmplifier',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        -1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] maxAllocationAmplifier is more MAX_AMPLIFIER', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid maxAllocationAmplifier',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                         1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        MAX_AMPLIFIER + 1,
                        1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: weightAmplifier: ', () => {
        //weightAmplifier_ must be less maxAllocationAmplifier_
        it('[+] maxAllocationAmplifier is 0 and weightAmplifier is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        0,
                        0,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.maxAllocationAmplifier).to.be.equal(0);
                expect(storage.weightAmplifier).to.be.equal(0);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] maxAllocationAmplifier is not 0 and weightAmplifier is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        0,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.weightAmplifier).to.be.equal(0);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] weightAmplifier is MAX_AMPLIFIER and maxAllocationAmplifier_ is MAX_AMPLIFIER', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        MAX_AMPLIFIER,
                        MAX_AMPLIFIER,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.maxAllocationAmplifier).to.be.equal(MAX_AMPLIFIER);
                expect(storage.weightAmplifier).to.be.equal(MAX_AMPLIFIER);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] weightAmplifier is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid weightAmplifier',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        -1,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] weightAmplifier is more maxAllocationAmplifier_', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid weightAmplifier',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                         2,
                        3,
                        1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: slippageRate_: ', () => {
        it('[+] slippageRate_ is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        0,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.slippageRate).to.be.equal(0n);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] slippageRate_ is MAX_INT', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        MAX_INT.toString(),
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.slippageRate).to.be.equal(MAX_INT);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] slippageRate_ is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid slippageRate',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        -1,
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] slippageRate_ is more MAX_INT', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid slippageRate',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        (MAX_INT + 1n).toString(),
                        1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: feeMaxRate_: ', () => {
        it('[+] feeMaxRate_ is 0', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.feeMaxRate).to.be.equal(0n);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[+] feeMaxRate_ is MAX_INT', async () => {
            await step('init',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        MAX_INT.toString(),
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(storage.feeMaxRate).to.be.equal(MAX_INT);
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
            });
        });
        it('[-] feeMaxRate_ is -1', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid feeMaxRate',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        -1,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
        it('[-] feeMaxRate_ is more MAX_INT', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid feeMaxRate',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        (MAX_INT + 1n).toString(),
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    });
    describe('testing param: protocolFeeContract_: ', () => {
        it('[-] invalid protocolFeeContract_ ', async () => {
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: init: invalid protocolFeeContract',
                async () => {
                    await init(
                        convertList2MapList([a1.assetId, a2.assetId]),
                        convertList2MapList(['1', '2']),
                        1,
                        1,
                        'pepeToken',
                        'pepe Reward Token',
                        1,
                        1,
                        1,
                        1,
                        1,
                        'ewrtewtewrt',
                        sender,
                        contract
                    )
                })
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(defaultState_ASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(defaultState_ASSET_WEIGHTS);
                expect(await getDataValue(contract, key_STORAGE, env.network)).to.be.equal(defaultState_STORAGE);
            });
        });
    })
    describe('testing different cases after completed init: ',() => {
        it('[-] second init() after first init()', async () => {
            await step('init', async () => {
                await init(
                    convertList2MapList([a1.assetId, a2.assetId]),
                    convertList2MapList(['1', '2']),
                    1,
                    1,
                    'pepeToken',
                    'pepe Reward Token',
                    1,
                    1,
                    1,
                    1,
                    1,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
            await stepIgnoreErrorByMessage('init',
                'Error while executing dApp: _whenNotInitialized: revert',
                async () => {
                await init(
                    convertList2MapList([a3.assetId, a4.assetId]),
                    convertList2MapList(['3', '4']),
                    1,
                    1,
                    'pepeToken',
                    'pepe Reward Token',
                    1,
                    1,
                    1,
                    1,
                    1,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            outConsoleOrAllure('storage', storage);
            await step('check state - is not changed', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
        });
        it('[+] check lpToken ', async () => {
            await step('init', async () => {
                await init(
                    convertList2MapList([a1.assetId, a2.assetId]),
                    convertList2MapList(['1', '2']),
                    1,
                    1,
                    'pepeToken',
                    'pepe Reward Token',
                    1,
                    1,
                    1,
                    1,
                    1,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            const expectedASSETS = `${a1.assetId}__${a2.assetId}`;
            const expectedASSET_WEIGHTS = `1__2`;
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
            });
        });
        it('[+] the pull with assets [a12,a13,a14,a15,a16,a17,a18] and decimals [2,3,4,5,6,7,8]', async () => {
            const masAssetsPayment = [a12,a13,a14,a15,a16,a17,a18];
            const initAssetWeight = [10,10,10,10,10,10,10]
            const initDepositAmoint = 10000000;
            await step(`init the pull with assetWeight "${initAssetWeight}"`, async () => {
                await init(
                    convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                    convertList2MapList(initAssetWeight.map(String)),
                    0,
                    0,
                    'pepeToken',
                    'pepe Reward Token',
                    8,
                    1,
                    0,
                    0,
                    0,
                    protocolFeeContract.address,
                    sender,
                    contract
                )
            })
            const expectedASSETS = `${a12.assetId}__${a13.assetId}__${a14.assetId}__${a15.assetId}__${a16.assetId}__${a17.assetId}__${a18.assetId}`;
            const expectedASSET_WEIGHTS = `10__10__10__10__10__10__10`;
            const expectedASSET_BALANCES = '0__0__0__0__0__0__0';
            let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            await step('check state', async () => {
                expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                expect(await getDataValue(contract, key_ASSET_BALANCES, env.network)).to.be.equal(expectedASSET_BALANCES);
                expect(storage.lpAssetId).to.be.not.equal('');
                expect(storage.unlocked).to.be.equal('1');
                expect(storage.lpTotalSupply).to.be.equal(0);
            });
        })
    });
})
