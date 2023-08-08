import {
    Account,
    Asset,
    Contract,
    getAccountByName,
    getAssetByName, getBalance,
    getContractByName,
    getDataValue, setContractState
} from "@pepe-team/waves-sc-test-utils";
import {
    deposit,
    depositAll,
    init,
    stake,
    withdraw,
    withdrawAll,
    swap,
    unstake,
    claim, fetchEvaluateSwap, getDeposit, getWithdrawAll, pause, unpause, updatePauser,
} from "../../steps/crosschain.swap";
import {step, stepCatchError, stepIgnoreError, stepIgnoreErrorByMessage} from "relax-steps-allure";
import {expect} from 'chai';
import {getEnvironment} from "relax-env-json";
import {
    cleanBalanceContract,
    convertList2MapList,
    convertToMasPayments,
    findBurnLpToken,
    findTransferToUserIntoTransaction,
    getHeightFromTransaction, getNormalized,
    outConsoleOrAllure,
    parseASSET_BALANCES,
    parseLP_FEE, parsePROTOCOL_FEE,
    parseSTORAGE,
} from "./helpers/helper";
import { beforeEach, describe} from "mocha";
import {getAssetContractBalance, getAssetInfo} from "../../steps/common";
import {AssetDecimals, InvokeScriptTransactionFromNode} from "@waves/ts-types";
import {TLong} from "@waves/node-api-js/cjs/interface";
import {CalculatorSwapClass, paramContract} from "./helpers/calculatorSwap";


const env = getEnvironment();

const key_ASSETS = 'ASSETS';
const key_ASSET_WEIGHTS = 'ASSET_WEIGHTS';
const key_STORAGE = 'STORAGE';
const key_ASSET_BALANCES = 'ASSET_BALANCES';
const defaultState_ASSETS = '';
const defaultState_ASSET_WEIGHTS = '';
const defaultState_STORAGE = '__0__0__0__0__0__0__0__0__3M3iPZv1iVEUjLXLJv5RFCmZhgmkfkkg3uP';
const defaultZERO11 = '0__0__0__0__0__0__0__0__0__0__0';
const defaultState_KEY_INCOME_INTEGRALS = '';
const KEY_USER_LP = "USER_LP"
const KEY_TOTAL_LP = "TOTAL_LP"
const KEY_USER_PROFITS = "USER_PROFITS"
const KEY_SIGMA_FEE_PER_LP = "SIGMA_FEE_PER_LP"
const KEY_USER_SIGMA_FEE_PER_LP = "USER_SIGMA_FEE_PER_LP"
const KEY_PAUSED = "PAUSED"
const KEY_PAUSER = "PAUSER"
const SEP = "__"
const WAVES = "waves"
const MAX_INT = 9223372036854775807n // 2^63 - 1
const MAX_FEE = 1000000
const MAX_AMPLIFIER = 1000000
const MAX_WEIGHT_AMPLIFIER = 1000000
const MAX_WEIGHT = 1000000
const SLIPPAGE_RATE_FACTOR = 1000000
const FEE_RATE_FACTOR = 1000000
const RATE_FACTOR = 1000000
const PERCENT_FACTOR = 1000000000000
const INT_DECIMALS = 8
const BIGINT_DECIMALS = 18
const LIST_32 = "0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0".split("_")

const paramContract:paramContract ={
    KEY_STORAGE : "STORAGE",
    KEY_ASSETS : "ASSETS",
    KEY_ASSET_BALANCES: "ASSET_BALANCES",
    KEY_ASSET_WEIGHTS : "ASSET_WEIGHTS",
    KEY_LP_FEE : "LP_FEE",
    KEY_PROTOCOL_FEE : "PROTOCOL_FEE",
    KEY_STAKING_BALANCE : "STAKING_BALANCE",
    KEY_TOTAL_STAKING_BALANCE: "TOTAL_STAKING_BALANCE",
    SEP : "__",
    WAVES : "waves",
    MAX_INT : 9223372036854775807n,
    MAX_FEE : 1000000,
    MAX_AMPLIFIER : 1000000,
    MAX_WEIGHT_AMPLIFIER : 1000000,
    MAX_WEIGHT : 1000000000000,
    SLIPPAGE_RATE_FACTOR : 1000000,
    FEE_RATE_FACTOR : 1000000,
    RATE_FACTOR : 1000000,
    PERCENT_FACTOR : 1000000000000n,
    INT_DECIMALS : 8,
    BIGINT_DECIMALS : 18,
    PRECISION : 1000000,
    LIST_25 : "0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0",
    KEY_USER_LP : "USER_LP",
    KEY_TOTAL_LP : "TOTAL_LP",
    KEY_USER_PROFITS : "USER_PROFITS",
    KEY_SIGMA_FEE_PER_LP : "SIGMA_FEE_PER_LP",
    KEY_USER_SIGMA_FEE_PER_LP : "USER_SIGMA_FEE_PER_LP",
    KEY_PAUSED : "PAUSED",
    KEY_PAUSER : "PAUSER",
    defaultZERO11 : defaultZERO11
}

let  calculatorSwap: CalculatorSwapClass;
let contract: Contract;
let [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22]: Asset[] = [];
let sender: Account;
let user: Account;
let user2: Account;
let user3: Account;
let user4: Account;
let user5: Account;
let userForGarbageMoney:Account;
let protocolFeeContract:Account;

describe('Testing depositAll ,deposit , withdrawAll, withdraw, stacking, evaluate: ', function () {
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
        user = getAccountByName('morpheus', this.parent?.ctx);
        user2 = getAccountByName('trinity', this.parent?.ctx);
        user3 = getAccountByName('max', this.parent?.ctx);
        user4 = getAccountByName('thomas', this.parent?.ctx);
        user5 = getAccountByName('gerry', this.parent?.ctx);
        protocolFeeContract = getAccountByName('manager', this.parent?.ctx);
        userForGarbageMoney = getAccountByName('jack',this.parent?.ctx)
        await step('set default state', async () => {
            await setContractState(
                {
                    data: [
                        {key: key_STORAGE, type: 'string', value: defaultState_STORAGE},
                        {key: key_ASSET_WEIGHTS, type: 'string', value: defaultState_ASSET_WEIGHTS},
                        {key: key_ASSETS, type: 'string', value: defaultState_ASSETS}
                    ]
                },
                {privateKey: contract.privateKey},
                env.network
            );
        });
        await cleanBalanceContract([a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22],userForGarbageMoney,contract,env.network);
        calculatorSwap =  new CalculatorSwapClass(contract,env.network,paramContract)
    });

    describe('Testing depositAll: ', function () {
        describe('depositAll when init not completed: ', function () {
            it('[-] exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('depositAll',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await depositAll(
                            400000000,
                            [
                                {assetId: a2.assetId, amount: 100000000},
                                {assetId: a3.assetId, amount: 100000000}
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
        });
        describe('depositAll when init completed (assets [a12,a13,a14,a15,a16,a17,a18] and decimals [2,3,4,5,6,7,8]), the pull is empty : ', function () {
            it('[+] the pull with assets [a12,a13,a14,a15,a16,a17,a18] and decimals [2,3,4,5,6,7,8], the pull is empty', async () => {
                const masAssetsPayment = [a12,a13,a14,a15,a16,a17,a18];
                const initAssetWeight = [10,10,10,10,10,10,10]
                const initDepositAmount = 10000000;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
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
                let expectedASSET_BALANCES = '0__0__0__0__0__0__0';
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state after init', async () => {
                    expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                    expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                    expect(await getDataValue(contract, key_ASSET_BALANCES, env.network)).to.be.equal(expectedASSET_BALANCES);
                    expect(storage.lpAssetId).to.be.not.equal('');
                    expect(storage.unlocked).to.be.equal('1');
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
                const masValuesPaymentIntoEmptyPull = [10,100,1000,10000,100000,1000000,10000000]
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange] =
                    await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPaymentIntoEmptyPull, initDepositAmount)
                await step(`depositAll with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                expectedASSET_BALANCES= '1428571__1428571__1428571__1428571__1428571__1428571__1428571';
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state after depositAll', async () => {
                    expect(await getDataValue(contract, key_ASSETS, env.network)).to.be.equal(expectedASSETS);
                    expect(await getDataValue(contract, key_ASSET_WEIGHTS, env.network)).to.be.equal(expectedASSET_WEIGHTS);
                    expect(await getDataValue(contract, key_ASSET_BALANCES, env.network)).to.be.equal(expectedASSET_BALANCES);
                    expect(storage.lpAssetId).to.be.not.equal('');
                    expect(storage.unlocked).to.be.equal('1');
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount);
                });
            })
        });
        describe('depositAll when init completed (2 assets with same decimals=8): ', function () {
            beforeEach(async () => {
                await step('init', async () => {
                    await init(
                        convertList2MapList([a2.assetId, a3.assetId]),
                        convertList2MapList(['50', '50']),
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
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage[\'lpTotalSupply\'] after init: ', storage['lpTotalSupply']);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
            });
            afterEach(async () => {
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage[\'lpTotalSupply\'] in the end: ', storage['lpTotalSupply']);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo:in the end: ', lpTokenInfo)
            });
            describe('when assetTotalSupply == 0 (the pull is empty)', function () {
                describe('check payment', function () {
                    it('[-] amount is 0', async () => {
                        await stepIgnoreErrorByMessage('depositAll',
                           `non-positive amount: 0 of ${a2.assetId}`,
                            async () => {
                                await depositAll(
                                    0,
                                    [
                                        {assetId: a2.assetId, amount: 0},
                                        {assetId: a3.assetId, amount: 0}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[-] payment less need amount(both amount less needed)', async () => {
                        await stepIgnoreError('depositAll',
                            'depositAll',
                            async () => {
                                await depositAll(
                                    400000000,
                                    [
                                        {assetId: a2.assetId, amount: 100000000},
                                        {assetId: a3.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[-] payment less need amount(one amount less needed)', async () => {
                        await stepIgnoreError('depositAll',
                            'depositAll',
                            async () => {
                                await depositAll(
                                    400000000,
                                    [
                                        {assetId: a2.assetId, amount: 200000000},
                                        {assetId: a3.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[-] payment with invalid asset', async () => {
                        await stepIgnoreErrorByMessage('depositAll',
                            'Error while executing dApp: depositAll: invalid payment: index=1',
                            async () => {
                                await depositAll(
                                    100000000,
                                    [
                                        {assetId: a2.assetId, amount: 100000000},
                                        {assetId: a4.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[-] payment without assets', async () => {
                        await stepIgnoreErrorByMessage('depositAll',
                            'Error while executing dApp: Index 0 out of bounds for length 0',
                            async () => {
                                await depositAll(
                                    100000000,
                                    [],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[-] payment without one asset', async () => {
                        await stepIgnoreErrorByMessage('depositAll',
                            'Error while executing dApp: Index 1 out of bounds for length 1',
                            async () => {
                                await depositAll(
                                    100000000,
                                    [
                                        {assetId: a2.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[+] payment with plus one unnecessary asset', async () => {
                        await step('depositAll',
                            async () => {
                                await depositAll(
                                    100000000,
                                    [
                                        {assetId: a2.assetId, amount: 200000000},
                                        {assetId: a3.assetId, amount: 300000000},
                                        {assetId: a4.assetId, amount: 400000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(100000000);
                        });
                    });

                });
                describe('[-] check amount deposit', function () {
                    it('[-] amount is -1', async () => {
                        await stepIgnoreErrorByMessage('depositAll',
                            'Error while executing dApp: depositAll: invalid amount',
                            async () => {
                                await depositAll(
                                    -1,
                                    [
                                        {assetId: a2.assetId, amount: 100000000},
                                        {assetId: a3.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                    it('[-] amount is more MAX_INT', async () => {
                        await stepIgnoreErrorByMessage('depositAll',
                            'Error while executing dApp: depositAll: invalid amount',
                            async () => {
                                await depositAll(
                                    MAX_INT + 1n,
                                    [
                                        {assetId: a2.assetId, amount: 100000000},
                                        {assetId: a3.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(0);
                        });
                    });
                });
                describe('[+] check amount and payment', function () {
                    it('[+] expected issue lpToken when get correct payment', async () => {
                        let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        let balanceUserBefore = await getBalance(user.address, env.network)
                        outConsoleOrAllure('balanceUserBefore', balanceUserBefore)
                        const assetContractBalanseBefore1 = await getAssetContractBalance(a2.assetId, contract, env.network);
                        const assetContractBalanseBefore2 = await getAssetContractBalance(a3.assetId, contract, env.network);
                        outConsoleOrAllure('assetContractBalanse1', assetContractBalanseBefore1);
                        outConsoleOrAllure('assetContractBalanse2', assetContractBalanseBefore2);
                        const paymentAmount = 5;
                        const depositAmount = 10;
                        const payment =
                            [
                                {assetId: a2.assetId, amount: paymentAmount},
                                {assetId: a3.assetId, amount: paymentAmount}
                            ]
                        await step('depositAll', async () => {
                            await depositAll(
                                depositAmount,
                                payment,
                                user,
                                contract
                            )
                        })
                        storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        const assetContractBalanseAfter1 = await getAssetContractBalance(a2.assetId, contract, env.network);
                        const assetContractBalanseAfter2 = await getAssetContractBalance(a3.assetId, contract, env.network);
                        outConsoleOrAllure('assetContractBalanseAfter1', assetContractBalanseAfter1);
                        outConsoleOrAllure('assetContractBalanseAfter2', assetContractBalanseAfter2);
                        const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                        const balanceUserAfter = await getBalance(user.address, env.network)
                        outConsoleOrAllure('balanceUserAfter', balanceUserAfter)
                        outConsoleOrAllure('balanceUserAfter - balanceUserBefore', balanceUserAfter - balanceUserBefore)
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                            expect(assetContractBalanseAfter1).to.be.equal(depositAmount / 2);//- assetContractBalanseBefore1
                            expect(assetContractBalanseAfter2).to.be.equal(depositAmount / 2);//- assetContractBalanseBefore2
                            expect(lpTokenInfo.quantity).to.be.equal(depositAmount);
                            expect(balanceUserBefore - balanceUserAfter).to.be.equal(100500000);//100500000 - fee waves
                        });
                    });
                    it('[+] expected issue lpToken when get payment more then need ', async () => {
                        let transaction;
                        let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        let balanceUserBefore = await getBalance(user.address, env.network)
                        outConsoleOrAllure('balanceUserBefore', balanceUserBefore)
                        const assetContractBalanseBefore1 = await getAssetContractBalance(a2.assetId, contract, env.network);
                        const assetContractBalanseBefore2 = await getAssetContractBalance(a3.assetId, contract, env.network);
                        outConsoleOrAllure('assetContractBalanse1', assetContractBalanseBefore1);
                        outConsoleOrAllure('assetContractBalanse2', assetContractBalanseBefore2);
                        const paymentAmount = 20 * 10 ** 8;
                        const depositAmount = 10 * 10 ** 8;
                        const payment =
                            [
                                {assetId: a2.assetId, amount: paymentAmount},
                                {assetId: a3.assetId, amount: paymentAmount}
                            ]
                        await step('depositAll', async () => {
                            transaction = await depositAll(
                                depositAmount,
                                payment,
                                user,
                                contract
                            )
                        })
                        storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        outConsoleOrAllure('storage', storage);
                        const assetContractBalanseAfter1 = await getAssetContractBalance(a2.assetId, contract, env.network);
                        const assetContractBalanseAfter2 = await getAssetContractBalance(a3.assetId, contract, env.network);
                        outConsoleOrAllure('assetContractBalanseAfter1', assetContractBalanseAfter1);
                        outConsoleOrAllure('assetContractBalanseAfter2', assetContractBalanseAfter2);
                        const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                        const balanceUserAfter = await getBalance(user.address, env.network)
                        outConsoleOrAllure('balanceUserAfter', balanceUserAfter)
                        outConsoleOrAllure('balanceUserAfter - balanceUserBefore', balanceUserAfter - balanceUserBefore)
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                            expect(assetContractBalanseAfter1).to.be.equal(depositAmount / 2);//- assetContractBalanseBefore1 не успевает очиститься
                            expect(assetContractBalanseAfter2).to.be.equal(depositAmount / 2);
                            expect(lpTokenInfo.quantity).to.be.equal(depositAmount);
                            expect(balanceUserBefore - balanceUserAfter).to.be.equal(100500000);//100500000 - fee waves
                        });
                    });
                });
            });
            describe('when assetTotalSupply != 0 (the pull is not empty, assets [a2,a3]): ', function () {
                beforeEach(async () => {
                    const paymentAmount = 5;
                    const depositAmount = 10;
                    const payment =
                        [
                            {assetId: a2.assetId, amount: paymentAmount},
                            {assetId: a3.assetId, amount: paymentAmount}
                        ]
                    await step('depositAll after init - make the pull not empty', async () => {
                        await depositAll(
                            depositAmount,
                            payment,
                            user,
                            contract
                        )
                    })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    outConsoleOrAllure('storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    outConsoleOrAllure('lpTokenInfo after deposit: ', lpTokenInfo)
                });
                it('[+] masAssetsPayment=[a2,a3], masValuesPayment=[300,300], depositAmount=600', async () => {
                    const masAssetsPayment = [a2, a3];
                    const masValuesPayment = [300, 300];
                    const depositAmount = 600;
                    const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        depositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPayment),
                        user,
                        contract
                    )
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                    const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    expect(sendLpToken).to.be.equal(lpTokensToMint)
                    expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                    expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(prevAssetTotalSupply+lpTokensToMint);
                    expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(prevAssetTotalSupply+lpTokensToMint);
                    expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                })
                it('[+] masAssetsPayment=[a2,a3], masValuesPayment=[20,20], depositAmount=40', async () => {
                    const masAssetsPayment = [a2, a3];
                    const masValuesPayment = [20, 20];
                    const depositAmount = 40;
                    const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        depositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPayment),
                        user,
                        contract
                    )
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                    const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    expect(sendLpToken).to.be.equal(lpTokensToMint)
                    expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                    expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(prevAssetTotalSupply+lpTokensToMint);
                    expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(prevAssetTotalSupply+lpTokensToMint);
                    expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                })
                it('[+] masAssetsPayment=[a2,a3], masValuesPayment=[3000,3000], depositAmount=600', async () => {
                    const masAssetsPayment = [a2, a3];
                    const masValuesPayment = [3000, 3000];
                    const depositAmount = 600;
                    const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        depositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPayment),
                        user,
                        contract
                    )
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                    const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    expect(sendLpToken).to.be.equal(lpTokensToMint)
                    expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                    expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(prevAssetTotalSupply+lpTokensToMint);
                    expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(prevAssetTotalSupply+lpTokensToMint);
                    expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                })
                it('[-] too little amount required', async () => {
                    const masAssetsPayment = [a2, a3];
                    const masValuesPayment = [300, 300];
                    const depositAmount = 1;
                    const [lpTokensToMint,assetBalances,assetTotalSupply,masChange] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                    const storageBefore = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await stepIgnoreErrorByMessage('depositAll',
                        'Error while executing dApp: depositAll: too little amount required',
                        async () => {
                            await depositAll(
                                depositAmount,
                                convertToMasPayments(masAssetsPayment, masValuesPayment),
                                user,
                                contract
                            )
                        })
                    const storageAfter = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storageBefore.lpTotalSupply).to.be.equal(storageAfter.lpTotalSupply);
                    });
                })
            });

        })
        describe('depositAll with different decimals(6 and 8) when the pull is empty: ', function () {
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a1.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a1.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                outConsoleOrAllure('a1.assetId: ', a1.assetId)
                outConsoleOrAllure('a3.assetId: ', a3.assetId)
                await step('init', async () => {
                    await init(
                        convertList2MapList([a1.assetId, a3.assetId]),
                        convertList2MapList(['50', '50']),
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
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
            });
            it('[+] get correct payment with different decimals( 6 and 8)', async () => {
                let transaction;
                let balanceUserBefore = await getBalance(user.address, env.network)
                outConsoleOrAllure('balanceUserBefore', balanceUserBefore)
                const assetContractBalanseBefore1 = await getAssetContractBalance(a1.assetId, contract, env.network);
                const assetContractBalanseBefore2 = await getAssetContractBalance(a3.assetId, contract, env.network);
                outConsoleOrAllure('assetContractBalanse1', assetContractBalanseBefore1);
                outConsoleOrAllure('assetContractBalanse2', assetContractBalanseBefore2);
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTotapSupplyBefore = storage['lpTotalSupply']
                outConsoleOrAllure('lpTotapSupplyBefore: ', lpTotapSupplyBefore)
                const paymentAmount = 300;
                const depositAmount = 600;
                const payment =
                    [
                        {assetId: a1.assetId, amount: paymentAmount},
                        {assetId: a3.assetId, amount: paymentAmount}
                    ]
                await step('depositAll', async () => {
                    transaction = await depositAll(
                        depositAmount,
                        payment,
                        user,
                        contract
                    )
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const assetContractBalanseAfter1 = await getAssetContractBalance(a1.assetId, contract, env.network);
                const assetContractBalanseAfter2 = await getAssetContractBalance(a3.assetId, contract, env.network);
                outConsoleOrAllure('assetContractBalanseAfter1', assetContractBalanseAfter1);
                outConsoleOrAllure('assetContractBalanseAfter2', assetContractBalanseAfter2);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const balanceUserAfter = await getBalance(user.address, env.network)
                outConsoleOrAllure('balanceUserAfter', balanceUserAfter)
                outConsoleOrAllure('balanceUserAfter - balanceUserBefore', balanceUserAfter - balanceUserBefore)
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(lpTotapSupplyBefore + 600);//lpTokensToMint
                    expect(assetContractBalanseAfter1).to.be.equal(3);//6 decimals
                    expect(assetContractBalanseAfter2).to.be.equal(300);//8 decimals ?
                    expect(lpTokenInfo.quantity).to.be.equal(lpTotapSupplyBefore + 600);//lpTokensToMint
                    expect(balanceUserBefore - balanceUserAfter).to.be.equal(100500000);//100500000 - fee waves
                });
            });
        })
        describe('the pull with assets [a1,a16] and decimals [6,6]: ', function () {
            beforeEach(async () => {
                const masAssetsPayment = [a1,a16];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        10,
                        5,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
            })
            it('case when user gives less than must', async () => {
                const masAssetsPayment = [a1,a16];
                const initDepositAmount = 300;
                const masValuesPaymentIntoEmptyPull = [8000,8000]
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPaymentIntoEmptyPull, initDepositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    initDepositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            });
        })
        describe('the pull with assets [a2,a3,a4] and decimals [8,8,8]: ', function () {
            beforeEach(async () => {
                const masAssetsPayment = [a2,a3,a4];
                const initAssetWeight = [50,50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        10,
                        5,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })

            })
            it(`masValuesPayment=[10,20,30], depositAmount=100000`, async () => {
                const masAssetsPayment = [a2,a3,a4];
                const masValuesPayment = [100000,200000,300000];
                const depositAmount = 100000;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
        })
        describe('the pull with assets [a11,a2,a3,a4,a5,a6,a7,a8,a9,a10] and decimals [8,8,8,8,8,8,8,8,8,8]: ', function () {
            beforeEach(async () => {
                const masAssetsPayment = [a11,a2,a3,a4,a5,a6,a7,a8,a9,a10];
                const initAssetWeight = [10,10,10,10,10,10,10,10,10,10]
                const initDepositAmount = 10;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
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
                const masValuesPaymentIntoEmptyPull = [10,10,10,10,10,10,10,10,10,10]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('beforeEach: lpTokenInfo: ', lpTokenInfo)
            })
            it(`masValuesPayment=[10,20,30,40,50,60,70,80,90,100], depositAmount=10`, async () => {
                const masAssetsPayment = [a11,a2,a3,a4,a5,a6,a7,a8,a9,a10];
                const masValuesPayment = [10,20,30,40,50,60,70,80,90,100];
                const depositAmount = 10;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it(`masValuesPayment=[10,20,30,40,50,60,70,80,90,100], depositAmount=100`, async () => {
                const masAssetsPayment = [a11,a2,a3,a4,a5,a6,a7,a8,a9,a10];
                const masValuesPayment = [10,20,30,40,50,60,70,80,90,100];
                const depositAmount = 100;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it(`masValuesPayment=[10,20,30,40,50,60,70,80,90,100], depositAmount=77`, async () => {
                const masAssetsPayment = [a11,a2,a3,a4,a5,a6,a7,a8,a9,a10];
                const masValuesPayment = [10,20,30,40,50,60,70,80,90,100];
                const depositAmount = 77;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
        })
        describe('the pull with assets [a12,a13,a14,a15,a16,a17,a18] and decimals [2,3,4,5,6,7,8]: ', function () {
            beforeEach(async () => {
                const masAssetsPayment = [a12,a13,a14,a15,a16,a17,a18];
                const initAssetWeight = [10,10,10,10,10,10,10]
                const initDepositAmount = 10000000;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
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
                const masValuesPaymentIntoEmptyPull = [10,100,1000,10000,100000,1000000,10000000]
                // const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPaymentIntoEmptyPull, initDepositAmount)
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalancesBeforeTest = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances before test: ', assetBalancesBeforeTest);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('beforeEach: lpTokenInfo: ', lpTokenInfo)
            })
            it('masValuesPayment=[10,100,1000,10000,100000,1000000,10000000], depositAmount=100000000', async () =>{
                const masAssetsPayment = [a12,a13,a14,a15,a16,a17,a18];
                const masValuesPayment = [10,100,1000,10000,100000,1000000,10000000]
                const depositAmount = 10000000;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);

            });
            it(`masValuesPayment=[10,200,3000,40000,500000,6000000,70000000], depositAmount=12345678`, async () => {
                const masAssetsPayment = [a12,a13,a14,a15,a16,a17,a18];
                const masValuesPayment = [10,200,3000,40000,500000,6000000,70000000]
                const depositAmount = 12345678;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it(`masValuesPayment=[2,20,300,4000,50000,142857,7000000], depositAmount=10000000`, async () => {
                const masAssetsPayment = [a12,a13,a14,a15,a16,a17,a18];
                const masValuesPayment = [2,20,300,4000,50000,142858,7000000]
                const depositAmount = 10000000;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDepositAll(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await depositAll(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
        })
    });

    describe('Testing deposit: ', function () {
        describe('deposit when init not completed: ', function () {
            it('[-] exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await deposit(
                            400000000,
                            [
                                {assetId: a2.assetId, amount: 100000000}
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });

        })
        describe('deposit when assetTotalSupply == 0 (the pull is empty), masAssetsPayment=[a2,a3], initAssetWeight=[10,10]: ', function () {
            beforeEach(async () => {
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                // const initDepositAmount = 10;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        80,
                        75,
                        100,
                        3,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
            });
            afterEach(async () => {
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage in the end: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo:in the end: ', lpTokenInfo)
            });
            it('[-] payment less need amount', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: _validateAssetAllocation: still up',
                    async () => {
                        await deposit(
                            400000000,
                            [
                                {assetId: a2.assetId, amount: 100000000}
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            })
            it('[-] payment with invalid asset', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: deposit: invalid payment asset',
                    async () => {
                        await deposit(
                            400000000,
                            [
                                {assetId: a5.assetId, amount: 100000000}
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            })
            it('[-] payment without asset', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: deposit: invalid payments size',
                    async () => {
                        await deposit(
                            400000000,
                            [],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            })
            it('[-] payment with plus one unnecessary asset', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: deposit: invalid payments size',
                    async () => {
                        await deposit(
                            400000000,
                            [{assetId: a2.assetId, amount: 100000000},
                                {assetId: a3.assetId, amount: 100000000}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            })
            it('[-] payment is amount -1 ', async () => {
                const isError = await stepCatchError('deposit',
                    // 'Error while executing dApp: _validateAssetAllocation: still up',
                    async () => {
                        await deposit(
                            400000000,
                            [
                                {assetId: a2.assetId, amount: -1}
                            ],
                            user,
                            contract
                        )
                    })
                await step('check error', async () => {
                    expect(isError).to.be.true;
                });
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
            it('[-] amount is -1', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: deposit: invalid min lp amount',
                    async () => {
                        await deposit(
                            -1,
                            [{assetId: a2.assetId, amount: 100000000}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            })
            it('[-] amount is more MAX_INT', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: deposit: invalid min lp amount',
                    async () => {
                        await deposit(
                            MAX_INT + 1n,
                            [{assetId: a2.assetId, amount: 100000000}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            })
        });
        describe('when assetTotalSupply != 0 (the pull is not empty): ', function () {
            beforeEach(async () => {
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                const initDepositAmount = 10000000;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        10,
                        30,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                const masValuesPaymentIntoEmptyPull = [10000000,10000000]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('beforeEach: lpTokenInfo: ', lpTokenInfo)
            });
            it('[+] masAssetsPayment=[a2],masValuesPayment=[100],depositAmount=100', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [100]
                const depositAmount = 100;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await deposit(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it('[+] masAssetsPayment=[a2],masValuesPayment=[8750000],depositAmount=8750000', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [8750000]
                const depositAmount = 8750000;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await deposit(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it('[+] masAssetsPayment=[a2],masValuesPayment=[100],depositAmount=0', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [100]
                const depositAmount = 0;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await deposit(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                // expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(masChange)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it('[+] masAssetsPayment=[a2],masValuesPayment=[100],depositAmount=30', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [200]
                const depositAmount = 30;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                const transaction: InvokeScriptTransactionFromNode = await deposit(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(sendLpToken).to.be.equal(lpTokensToMint)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal([0])
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTokenBefore + lpTokensToMint);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTokenBefore + lpTokensToMint);
            })
            it('[-] error "Error while executing dApp: _validateAssetAllocation: new up"', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [164150000]
                const depositAmount = 164150000;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                await stepIgnoreErrorByMessage('deposit',
                    `Error while executing dApp: _validateAssetAllocation: new up`, async () => {
                        await deposit(
                            depositAmount,
                            convertToMasPayments(masAssetsPayment, masValuesPayment),
                            user,
                            contract
                        )})
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(lpTokenBefore);
                });
            })
            it('[-] masAssetsPayment=[a2],masValuesPayment=[0],depositAmount=0 - error "non-positive amount: 0 of ..."', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [0]
                const depositAmount = 0;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                await stepIgnoreErrorByMessage('deposit',
                    `non-positive amount: 0 of ${a2.assetId}`, async () => {
                    await deposit(
                    depositAmount,
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )})
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(lpTokenBefore);
                });
            })
            it('[-] masAssetsPayment=[a2],masValuesPayment=[-1],depositAmount=10 - error "non-positive amount: -1 of ..."', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [-1]
                const depositAmount = 10;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                await stepIgnoreErrorByMessage('deposit',
                    `non-positive amount: -1 of ${a2.assetId}`,
                    async () => {
                        await deposit(
                            depositAmount,
                            convertToMasPayments(masAssetsPayment, masValuesPayment),
                            user,
                            contract
                        )})
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(lpTokenBefore);
                });
            })
            it('[-] masAssetsPayment=[a2],masValuesPayment=[751],depositAmount=751 - error "depositSelective: less than min lp"', async () => {
                const masAssetsPayment = [a2];
                const masValuesPayment = [751]
                const depositAmount = 751;
                const [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,lpTokenBefore] = await calculatorSwap.calculateDeposit(masAssetsPayment, masValuesPayment, depositAmount)
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: deposit: less than min lp',
                    async () => {
                        await deposit(
                            depositAmount,
                            convertToMasPayments(masAssetsPayment, masValuesPayment),
                            user,
                            contract
                        )})
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(lpTokenBefore);
                });
            })
        })
    })

    describe('Testing withdrawAll: ', function () {
        describe('withdrawAll when init not completed: ', function () {
            it('[-] exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await withdrawAll(
                            convertToMasPayments([a2,a3], [100,100]),
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
        })
        describe('withdrawAll when init completed(small values for fee by init): ', function () {
            let lpToken: Asset;
            beforeEach(async () => {
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                const initDepositAmount = 100;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        80,
                        75,
                        10,
                        30,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
            });
            afterEach(async () => {
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage in the end: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo:in the end: ', lpTokenInfo)
            });
            describe('when assetTotalSupply == 0 (the pull is empty)', function () {

                it('[-] try withdraw with payment', async () => {
                    await stepIgnoreErrorByMessage('withdraw',
                        'Error while executing dApp: withdrawAll: invalid payment asset',
                        async () => {
                            await withdrawAll(
                                [
                                    {assetId: a2.assetId, amount: 100000000}
                                ],
                                user,
                                contract
                            )
                        })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                });
                it('[-] try withdraw without payment', async () => {
                    await stepIgnoreErrorByMessage('withdraw',
                        'Error while executing dApp: withdrawAll: invalid payments size',
                        async () => {
                            await withdrawAll(
                                [],
                                user,
                                contract
                            )
                        })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                });
                it('[-] payment is amount -1 ', async () => {
                    const isError = await stepCatchError('withdraw',
                        async () => {
                            await withdrawAll(
                                [
                                    {assetId: a2.assetId, amount: -1}
                                ],
                                user,
                                contract
                            )
                        })
                    await step('check error', async () => {
                        expect(isError).to.be.true;
                    });
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                })
            })
            describe('when assetTotalSupply != 0 (the pull is not empty): ', function () {
                beforeEach(async () => {
                    const masAssetsPayment = [a2,a3];
                    const initDepositAmount = 1000;
                    const masValuesPaymentIntoEmptyPull = [500,500]
                    await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                        const transaction: InvokeScriptTransactionFromNode = await depositAll(
                            initDepositAmount,
                            convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                            user,
                            contract
                        )
                    })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                    const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    // outConsoleOrAllure('beforeEach: lpTokenInfo: ', lpTokenInfo)
                    lpToken = {
                        name: lpTokenInfo.name,
                        description: lpTokenInfo.description,
                        quantity: lpTokenInfo.quantity as number,
                        decimals: lpTokenInfo.decimals,
                        assetId: lpTokenInfo.assetId
                    }
                    lpToken["quantity"] = Number(lpTokenInfo.quantity)
                });
                it('[+] withdrawAll for the pull(assets: [a2,a3]) - full lpTokens from the pull', async () => {
                    const masAssetsPayment = [lpToken];
                    const masValuesPayment = [lpToken.quantity]
                    const [assetBalances, paymentActions, lpTotalSupplyUpdated] =
                        await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                    const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                        convertToMasPayments(masAssetsPayment, masValuesPayment),
                        user,
                        contract
                    )
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                    const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                    const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    expect(burnAmountLpToken).to.be.equal(lpToken.quantity)
                    expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                    expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                    expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                    expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
                })
                it('[+] withdrawAll for the pull(assets: [a2,a3]) - half lpTokens from the pull', async () => {
                    const masAssetsPayment = [lpToken];
                    const masValuesPayment = [lpToken.quantity/2]
                    const [assetBalances, paymentActions, lpTotalSupplyUpdated] =
                        await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                    const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                        convertToMasPayments(masAssetsPayment, masValuesPayment),
                        user,
                        contract
                    )
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                    const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                    const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    expect(burnAmountLpToken).to.be.equal(lpToken.quantity/2)
                    expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                    expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                    expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                    expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
                })
            })
        })
        describe('withdrawAll when init completed(the pull with asset[a2,a3])(check different fee): ', function () {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                const initDepositAmount = 1000;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300000,
                        400000,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [500,500]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[-] try withdraw with payment', async () => {
                await stepIgnoreErrorByMessage('withdraw',
                    'Error while executing dApp: withdrawAll: invalid payment asset',
                    async () => {
                        await withdrawAll(
                            [
                                {assetId: a5.assetId, amount: 100000000}
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(1000);
                });
            });
            it('[-] try withdraw without payment', async () => {
                await stepIgnoreErrorByMessage('withdraw',
                    'Error while executing dApp: withdrawAll: invalid payments size',
                    async () => {
                        await withdrawAll(
                            [],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(1000);
                });
            });
            it('withdrawAll for the pull(assets: [a2,a3]) - half lpTokens from the pull (check lpFee and protocolFee )', async () => {
                const masAssetsPayment = [lpToken];
                const masValuesPayment = [lpToken.quantity/2]
                const [assetBalances, paymentActions, lpTotalSupplyUpdated,amount] =
                    await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(burnAmountLpToken).to.be.equal(amount)//? act350 450
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
            });
            it('withdrawAll for the pull(assets: [a2,a3]) - full lpTokens from the pull (check lpFee and protocolFee)', async () => {
                const masAssetsPayment = [lpToken];
                const masValuesPayment = [lpToken.quantity]
                const [assetBalances, paymentActions, lpTotalSupplyUpdated,amount] =
                    await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(burnAmountLpToken).to.be.equal(amount)// act 700 900
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
            });
        })
        describe('withdrawAll when init completed (assets with decimals 6 and 8): ', function () {
            let lpToken: Asset;
            beforeEach(async () => {
                const masAssetsPayment = [a1,a2,a3];
                const initAssetWeight = [30,50,20]
                const initDepositAmount = 1000;
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,//10,
                        0,//10,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        80,
                        75,
                        1,
                        3,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [3,500,200]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[+] withdrawAll for the pull(assets: [a1,a2,a3]) - half lpTokens from the pull', async () => {
                const masAssetsPayment = [lpToken];
                const masValuesPayment = [lpToken.quantity/2]
                const [assetBalances, paymentActions, lpTotalSupplyUpdated] =
                    await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a1,a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(burnAmountLpToken).to.be.equal(lpToken.quantity/2)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
            })
            it('[+] withdrawAll for the pull(assets: [a1,a2,a3]) - full lpTokens from the pull', async () => {
                const masAssetsPayment = [lpToken];
                const masValuesPayment = [lpToken.quantity]
                const [assetBalances, paymentActions, lpTotalSupplyUpdated] =
                    await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a1,a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(burnAmountLpToken).to.be.equal(lpToken.quantity)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
            })
            it('[+] withdrawAll for the pull(assets: [a1,a2,a3]) - 1/10(or 10%) lpTokens from the pull', async () => {
                const masAssetsPayment = [lpToken];
                const masValuesPayment = [lpToken.quantity/10]
                const [assetBalances, paymentActions, lpTotalSupplyUpdated] =
                    await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a1,a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(burnAmountLpToken).to.be.equal(lpToken.quantity/10)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
            })
            it('[+] withdrawAll for the pull(assets: [a1,a2,a3]) - 77% lpTokens from the pull', async () => {
                const masAssetsPayment = [lpToken];
                const masValuesPayment = [lpToken.quantity*77/100]
                const [assetBalances, paymentActions, lpTotalSupplyUpdated] =
                    await calculatorSwap.calculateWithdrawAll(masAssetsPayment, masValuesPayment)
                const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                    convertToMasPayments(masAssetsPayment, masValuesPayment),
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a1,a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                expect(burnAmountLpToken).to.be.equal(lpToken.quantity*77/100)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal(paymentActions)
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyUpdated);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyUpdated);
            })
        })
    })

    describe('Testing withdraw: ', function () {
        describe('withdraw when init not completed: ', function () {
            it('[-] exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await withdraw(
                            a1.assetId,
                            100,
                            [
                                {assetId: a2.assetId, amount: 200},
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
        })
        describe('deposit when init completed: ', function () {
            let lpToken: Asset;
            beforeEach(async () => {
                const masAssetsPayment = [a2, a3];
                const initAssetWeight = [50, 50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {
                            return x.assetId
                        })),
                        convertList2MapList(initAssetWeight.map(String)),
                        0,
                        0,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        10,
                        5,
                        0,
                        0,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            afterEach(async () => {
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage in the end: ', storage);
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo:in the end: ', lpTokenInfo)
            });
            describe('when assetTotalSupply == 0 (the pull is empty): ', function () {
                it('[-] try withdraw with payment', async () => {
                    const withdrawAmount = 10
                    await stepIgnoreErrorByMessage('withdraw',
                        'Error while executing dApp: withdraw: invalid payment asset',
                        async () => {
                            await withdraw(
                                a2.assetId,
                                withdrawAmount,
                                [
                                    {assetId: a2.assetId, amount: 100000000}
                                ],
                                user,
                                contract
                            )
                        })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                });
                it('[-] try withdraw without payment', async () => {
                    const withdrawAmount = 10;
                    await stepIgnoreErrorByMessage('withdraw',
                        'Error while executing dApp: withdraw: invalid payments size',
                        async () => {
                            await withdraw(
                                a2.assetId,
                                withdrawAmount,
                                [],
                                user,
                                contract
                            )
                        })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                });
                it('[-] try withdraw with payment more than need', async () => {
                    const withdrawAmount = 10;
                    await stepIgnoreErrorByMessage('withdraw',
                        'Error while executing dApp: withdraw: invalid payments size',
                        async () => {
                            await withdraw(
                                a2.assetId,
                                withdrawAmount,
                                [ {assetId: a2.assetId, amount: 100000000},
                                    {assetId: a3.assetId, amount: 100000000}],
                                user,
                                contract
                            )
                        })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                });
                it('[-] try withdraw without payment', async () => {
                    await stepIgnoreErrorByMessage('withdraw',
                        'Error while executing dApp: withdraw: invalid payments size',
                        async () => {
                            await withdraw(
                                a2.assetId,
                                10,
                                [
                                ],
                                user,
                                contract
                            )
                        })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    await step('check state', async () => {
                        expect(storage.lpTotalSupply).to.be.equal(0);
                    });
                });
            })
            describe('when assetTotalSupply != 0 (the pull is not empty): ', function () {
                const paymentAmount = 5;
                const depositAmount = 10;
                const countLpTokenByUser = depositAmount;
                let lpTokenInfo: {
                    assetId: any;
                    issueHeight?: number;
                    issueTimestamp?: number;
                    issuer?: string;
                    issuerPublicKey?: string;
                    name?: string;
                    description?: string;
                    decimals?: AssetDecimals;
                    reissuable?: boolean;
                    quantity?: TLong;
                    scripted?: boolean;
                    minSponsoredAssetFee?: TLong | null;
                    originTransactionId?: string;
                };
                beforeEach(async () => {
                    const payment =
                        [
                            {assetId: a2.assetId, amount: paymentAmount},
                            {assetId: a3.assetId, amount: paymentAmount}
                        ]
                    await step('depositAll', async () => {
                        await depositAll(
                            depositAmount,
                            payment,
                            user,
                            contract
                        )
                    })
                    const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    outConsoleOrAllure('storage after deposit: ', storage);
                    lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    outConsoleOrAllure('lpTokenInfo after deposit: ', lpTokenInfo)
                    lpToken = {
                        name: lpTokenInfo.name as string,
                        description: lpTokenInfo.description as string,
                        quantity: lpTokenInfo.quantity as number,
                        decimals: lpTokenInfo.decimals as number,
                        assetId: lpTokenInfo.assetId
                    }
                });
                describe('check payment: ', function () {
                    it('[-] try withdraw with payment invalid asset', async () => {
                        const withdrawAmount = 10;
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid payment asset',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: a2.assetId, amount: 100000000}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw without payment', async () => {
                        const withdrawAmount = 10;
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid payments size',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw with payment more than one asset', async () => {
                        const withdrawAmount = 10;
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid payments size',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [{assetId: a2.assetId, amount: depositAmount},
                                        {assetId: a3.assetId, amount: depositAmount}],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] payment is amount -1 ', async () => {
                        const withdrawAmount = 10;
                        const isError = await stepCatchError('withdraw',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: a2.assetId, amount: -1}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        await step('check error', async () => {
                            expect(isError).to.be.true;
                        });
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    })
                })
                describe('check param function withdraw: ', function () {
                    it('[-] try withdraw more funds than you have', async () => {
                        const withdrawAmount = 10;
                        const isError = await stepCatchError('withdraw',
                            // 'Error while executing dApp: withdraw: invalid payment asset',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: lpTokenInfo.assetId, amount: depositAmount + 1}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(isError).to.be.true;
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw in invalid asset', async () => {
                        const withdrawAmount = 10;
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid assetId',
                            async () => {
                                await withdraw(
                                    a4.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: lpTokenInfo.assetId, amount: depositAmount}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw amount is -1', async () => {
                        const withdrawAmount = -1;
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid amount',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: lpTokenInfo.assetId, amount: depositAmount}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw amount is more MAX_INT', async () => {
                        const withdrawAmount = MAX_INT + 1n
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid amount',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: lpTokenInfo.assetId, amount: depositAmount}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw with withdrawAmount=-10', async () => {
                        outConsoleOrAllure('lpToken.assetId: ', lpToken.assetId)
                        const withdrawAmount = -10;
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: withdraw: invalid amount',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [ {assetId: lpToken.assetId, amount: 10}],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(lpToken.quantity);//not changed
                        });
                    });
                    it('[-] try withdraw amount more than gave ', async () => {
                        const withdrawAmount = depositAmount / 2
                        await stepIgnoreErrorByMessage('withdraw',
                            'Error while executing dApp: _validateAssetAllocation: new down',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount+1,
                                    [
                                        {assetId: lpToken.assetId, amount: withdrawAmount}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    });
                    it('[-] try withdraw with payment less needed', async () => {
                        const withdrawAmount = 10;
                        const isError = await stepCatchError('withdraw',
                            // 'Error while executing dApp: withdraw: invalid payment asset',
                            async () => {
                                await withdraw(
                                    a2.assetId,
                                    withdrawAmount,
                                    [
                                        {assetId: lpToken.assetId, amount: withdrawAmount + 1}
                                    ],
                                    user,
                                    contract
                                )
                            })
                        const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                        await step('check state', async () => {
                            expect(isError).to.be.true;
                            expect(storage.lpTotalSupply).to.be.equal(depositAmount);
                        });
                    })
                });
            })
        })
        describe('withdraw when the pull is not empty with assets[a2,a3], decimals=[8,8]: ',function () {
            let lpToken: Asset;
            const initDepositAmount = 1000;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [500,500]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[-] try withdraw, withdrawAmount = initDepositAmount/10 (10% from lpTotalSupply) error: withdraw: insufficient amount', async () => {
                const withdrawAmount = initDepositAmount/10
                const amountLpPayment = withdrawAmount
                const [assetBalances,lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction] =
                    await calculatorSwap.calculateWithdraw(a2, withdrawAmount,amountLpPayment)
                await stepIgnoreErrorByMessage('withdraw',
                    'Error while executing dApp: withdraw: insufficient amount',
                    async () => {
                        await withdraw(
                            a2.assetId,
                            withdrawAmount,
                            [
                                {assetId: lpToken.assetId, amount: amountLpPayment}
                            ],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(lpTotalSupplyBefore);
                    expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyBefore);
                });
            });
            it('[+] try withdraw, withdrawAmount = initDepositAmount/10 (10% from lpTotalSupply)', async () => {
                const withdrawAmount = initDepositAmount/10
                const [assetBalances,lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction] =
                    await calculatorSwap.calculateWithdraw(a2, withdrawAmount,125)
                const amountLpPayment =requiredLpTokens // withdrawAmount+lpFee+protocolFee
                const transaction: InvokeScriptTransactionFromNode = await withdraw(
                    a2.assetId,
                    withdrawAmount,
                    [
                        {assetId: lpToken.assetId, amount: amountLpPayment}
                    ],
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                const lpFeeFromKeyState = await parseLP_FEE(contract, lpToken.assetId, env.network);
                const protocolFeeFromKeyState = await parsePROTOCOL_FEE(contract, lpToken.assetId, env.network);
                expect(burnAmountLpToken,'Incorrect amount lpTokens').to.be.equal(lpTokensToBurn)
                expect(burnAmountLpToken,'Incorrect amount lpTokens by amountLpPayment').to.be.equal(getNormalized(withdrawAmount,a2.decimals,lpToken.decimals))
                expect(requiredLpTokens,'Incorrect amount lpTokens by fees').to.be.equal(getNormalized(withdrawAmount,a2.decimals,lpToken.decimals)+lpFeeFromKeyState+protocolFeeFromKeyState)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal([withdrawAmount,0])
                expect(changeAction,'Incorrect refund').to.be.deep.equal([sendLpToken])//? act 17 0
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpFeeFromKeyState,'Incorrect record lpFee into STORAGE').to.be.equal(lpFee);
                expect(protocolFeeFromKeyState,'Incorrect record protocolFee into STORAGE').to.be.equal(protocolFee);
            });
            it('[+] try withdraw, withdrawAmount = initDepositAmount/3 (30% from lpTotalSupply)', async () => {
                const withdrawAmount = Math.floor(initDepositAmount/3)
                const [assetBalances,lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction] =
                    await calculatorSwap.calculateWithdraw(a2, withdrawAmount,416)
                const amountLpPayment =requiredLpTokens
                outConsoleOrAllure('requiredLpTokens: ',requiredLpTokens)
                const transaction: InvokeScriptTransactionFromNode = await withdraw(
                    a2.assetId,
                    withdrawAmount,
                    [
                        {assetId: lpToken.assetId, amount: amountLpPayment}
                    ],
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                const lpFeeFromKeyState = await parseLP_FEE(contract, lpToken.assetId, env.network);
                const protocolFeeFromKeyState = await parsePROTOCOL_FEE(contract, lpToken.assetId, env.network);
                expect(burnAmountLpToken,'Incorrect amount lpTokens').to.be.equal(lpTokensToBurn)
                expect(burnAmountLpToken,'Incorrect amount lpTokens by amountLpPayment').to.be.equal(getNormalized(withdrawAmount,a2.decimals,lpToken.decimals))
                expect(requiredLpTokens,'Incorrect amount lpTokens by fees').to.be.equal(getNormalized(withdrawAmount,a2.decimals,lpToken.decimals)+lpFeeFromKeyState+protocolFeeFromKeyState)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal([withdrawAmount,0])
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(changeAction,'Incorrect refund').to.be.deep.equal([sendLpToken])//? act 59 0
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpFeeFromKeyState,'Incorrect record lpFee into STORAGE').to.be.equal(lpFee);
                expect(protocolFeeFromKeyState,'Incorrect record protocolFee into STORAGE').to.be.equal(protocolFee);
            });
            it('[+] try withdraw, withdrawAmount = initDepositAmount/10 (10% from lpTotalSupply) and payment more than need', async () => {
                const withdrawAmount = initDepositAmount/10
                const [assetBalances,lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction] =
                    await calculatorSwap.calculateWithdraw(a2, withdrawAmount,125+1)
                const amountLpPayment =requiredLpTokens+1 // withdrawAmount+lpFee+protocolFee
                outConsoleOrAllure('requiredLpTokens: ',requiredLpTokens)//142
                const transaction: InvokeScriptTransactionFromNode = await withdraw(
                    a2.assetId,
                    withdrawAmount,
                    [
                        {assetId: lpToken.assetId, amount: amountLpPayment}
                    ],
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                const lpFeeFromKeyState = await parseLP_FEE(contract, lpToken.assetId, env.network);
                const protocolFeeFromKeyState = await parsePROTOCOL_FEE(contract, lpToken.assetId, env.network);
                expect(burnAmountLpToken,'Incorrect amount lpTokens').to.be.equal(lpTokensToBurn)
                expect(burnAmountLpToken,'Incorrect amount lpTokens by amountLpPayment').to.be.equal(getNormalized(withdrawAmount,a2.decimals,lpToken.decimals))
                expect(requiredLpTokens,'Incorrect amount lpTokens by fees').to.be.equal(getNormalized(withdrawAmount,a2.decimals,lpToken.decimals)+lpFeeFromKeyState+protocolFeeFromKeyState)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal([withdrawAmount,0])
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(changeAction,'Incorrect refund').to.be.deep.equal([sendLpToken])//? act 16 1
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpFeeFromKeyState,'Incorrect record lpFee into STORAGE').to.be.equal(lpFee);
                expect(protocolFeeFromKeyState,'Incorrect record protocolFee into STORAGE').to.be.equal(protocolFee);
            });
        })
        describe('withdraw when the pull is not empty with assets[a1,a3], decimals=[6,8]: ',function () {
            let lpToken: Asset;
            const initDepositAmount = 1000;
            beforeEach(async () => {
                const masAssetsPayment = [a1,a3];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [5,500]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const transaction: InvokeScriptTransactionFromNode = await depositAll(
                        initDepositAmount,
                        convertToMasPayments(masAssetsPayment, masValuesPaymentIntoEmptyPull),
                        user,
                        contract
                    )
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[+] try withdraw, withdrawAmount = 2(from 5 asset a1 decimals 6)', async () => {
                const withdrawAmount = 2
                const [assetBalances,lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction] =
                    await calculatorSwap.calculateWithdraw(a1, withdrawAmount,285)
                const amountLpPayment =requiredLpTokens+85 // withdrawAmount+lpFee+protocolFee
                const transaction: InvokeScriptTransactionFromNode = await withdraw(
                    a1.assetId,
                    withdrawAmount,
                    [
                        {assetId: lpToken.assetId, amount: amountLpPayment}
                    ],
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a1,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                const lpFeeFromKeyState = await parseLP_FEE(contract, lpToken.assetId, env.network);
                const protocolFeeFromKeyState = await parsePROTOCOL_FEE(contract, lpToken.assetId, env.network);
                expect(burnAmountLpToken,'Incorrect amount lpTokens').to.be.equal(lpTokensToBurn)
                expect(burnAmountLpToken,'Incorrect amount lpTokens by amountLpPayment').to.be.equal(getNormalized(withdrawAmount,a1.decimals,lpToken.decimals))//
                // expect(requiredLpTokens,'Incorrect amount lpTokens by fees').to.be.equal(getNormalized(withdrawAmount,a1.decimals,lpToken.decimals)+lpFeeFromKeyState+protocolFeeFromKeyState)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal([withdrawAmount,0])
                expect(changeAction,'Incorrect refund').to.be.deep.equal([sendLpToken])
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpFeeFromKeyState,'Incorrect record lpFee into STORAGE').to.be.equal(lpFee);
                expect(protocolFeeFromKeyState,'Incorrect record protocolFee into STORAGE').to.be.equal(protocolFee);
            });
            it('[+] try withdraw, withdrawAmount = 2(from 5 asset a1 decimals 6) + payment more than need', async () => {
                const withdrawAmount = 2
                const [assetBalances,lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction] =
                    await calculatorSwap.calculateWithdraw(a1, withdrawAmount,300)
                const amountLpPayment =requiredLpTokens+100 // withdrawAmount+lpFee+protocolFee
                const transaction: InvokeScriptTransactionFromNode = await withdraw(
                    a1.assetId,
                    withdrawAmount,
                    [
                        {assetId: lpToken.assetId, amount: amountLpPayment}
                    ],
                    user,
                    contract
                )
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a1,a3],lpTokenInfo.assetId)
                const burnAmountLpToken = findBurnLpToken(transaction,lpTokenInfo.assetId)
                const balancesAssetKey = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                const lpFeeFromKeyState = await parseLP_FEE(contract, lpToken.assetId, env.network);
                const protocolFeeFromKeyState = await parsePROTOCOL_FEE(contract, lpToken.assetId, env.network);
                expect(burnAmountLpToken,'Incorrect amount lpTokens').to.be.equal(lpTokensToBurn)
                expect(burnAmountLpToken,'Incorrect amount lpTokens by amountLpPayment').to.be.equal(getNormalized(withdrawAmount,a1.decimals,lpToken.decimals))//
                // expect(requiredLpTokens,'Incorrect amount lpTokens by fees').to.be.equal(getNormalized(withdrawAmount,a1.decimals,lpToken.decimals)+lpFeeFromKeyState+protocolFeeFromKeyState)
                expect(masReturnFunds,'Return funds is not correct!').to.be.deep.equal([withdrawAmount,0])
                expect(changeAction,'Incorrect refund').to.be.deep.equal([sendLpToken])
                expect(balancesAssetKey,'Incorrect record into ASSET_BALANCES').to.be.deep.equal(assetBalances);
                expect(storage.lpTotalSupply,'Incorrect record lpTotalSupply into STORAGE').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpTokenInfo.quantity,'Incorrect real quantity of lpToken').to.be.equal(lpTotalSupplyBefore-lpTokensToBurn);
                expect(lpFeeFromKeyState,'Incorrect record lpFee into STORAGE').to.be.equal(lpFee);
                expect(protocolFeeFromKeyState,'Incorrect record protocolFee into STORAGE').to.be.equal(protocolFee);
            });

        })
    })

    describe('Testing stacking: ',function () {
        describe('stake/instake/claim/checkpoint when init not completed: ',function () {
            it('[-] check stake - exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await stake(
                            [{assetId: a2.assetId, amount: 10}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
            it('[-] check unstake - exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('deposit',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await unstake(
                            0,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
            it('[-] check claim - exception whenInitialized', async () => {
                await stepIgnoreErrorByMessage('claim',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await claim(
                            '',
                            convertList2MapList([a2.assetId]),
                            //2,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(0);
                });
            });
        })
        describe('first call stake',function () {
            let lpToken: Asset;
            const initDepositAmount = 200;
            beforeEach(async () => {
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [100,100]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const masCommand =[
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user2},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user3},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user4},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user5},
                    ]
                    const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            //work in test O_N_L_Y after reset node!!!
            xit('try stake first time when state is empty for staking - work in test O_N_L_Y after reset node!!!', async () => {
                const paymentAmount = 100;
                const transaction = await stake(
                    [{assetId: lpToken.assetId, amount: paymentAmount}],
                    user,
                    contract
                )
                const height = getHeightFromTransaction(transaction)
                const state = await calculatorSwap.getStateForStaking([user],[lpToken])
                outConsoleOrAllure('state: ', state)
                expect(state.ASSET_BALANCES).to.be.equal('498__498')
                expect(state.TOTAL_LP).to.be.equal(paymentAmount)
                expect(state.USER_LP[0]).to.be.equal(paymentAmount)
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11)
            });
        })
        describe('stake when the pull not empty,no fee inside the pull: ',function () {
            let lpToken: Asset;
            const initDepositAmount = 200;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [100,100]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const masCommand =[
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user2},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user3},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user4},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user5},
                    ]
                    const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[-] try stake with invalid payment asset', async () => {
                await stepIgnoreErrorByMessage('stake',
                    'Error while executing dApp: stake: invalid payment asset',
                    async () => {
                        await stake(
                            [{assetId: a2.assetId, amount: 1000}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount*5);
                });
            });
            it('[-] try stake with invalid payments size', async () => {
                await stepIgnoreErrorByMessage('stake',
                    'Error while executing dApp: stake: invalid payments size',
                    async () => {
                        await stake(
                            [{assetId: a2.assetId, amount: 1000},
                                {assetId: a3.assetId, amount: 1000}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount*5);
                });
            });
            it('[-] try stake with invalid payments size(without payment)', async () => {
                await stepIgnoreErrorByMessage('stake',
                    'Error while executing dApp: stake: invalid payments size',
                    async () => {
                        await stake(
                            [],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount*5);
                });
            });
            it('[-] try stake amount is -1', async () => {
                await stepIgnoreErrorByMessage('stake',
                    `non-positive amount: -1 of ${a2.assetId}`,
                    async () => {
                        await stake(
                            [{assetId: a2.assetId, amount: -1}],
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount*5);
                });
            });
            it('[+] try stake', async () => {
                const paymentAmount = 100;
                const [stakedBalanceSum,totalLpSum] = await calculatorSwap.calculateStake(user,paymentAmount)
                const transaction = await stake(
                    [{assetId: lpToken.assetId, amount: paymentAmount}],
                    user,
                    contract
                )
                const height = getHeightFromTransaction(transaction)
                const state = await calculatorSwap.getStateForStaking([user],[lpToken])
                outConsoleOrAllure('state: ', state);
                expect(state.ASSET_BALANCES).to.be.equal('498__498')
                expect(state.TOTAL_LP).to.be.equal(paymentAmount)
                expect(state.USER_LP[0]).to.be.equal(paymentAmount)
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11)
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(defaultZERO11)
                expect(totalLpSum).to.be.equal(paymentAmount)
            })
        })
        describe('stake when the pull not empty,have fee inside the pull: ',function () {
            let lpToken: Asset;
            const decimal = 1//10**8;
            const initDepositAmount = 200*decimal;
            const masValuesPaymentIntoEmptyPull = [100*decimal, 100*decimal]
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user3.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user4.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user5.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                let masAssetsPayment = [a2, a3];
                const initAssetWeight = [50, 50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {
                            return x.assetId
                        })),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                // outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)

                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const masCommand =[
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user2},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user3},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user4},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user5},
                    ]
                    const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                    storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                    outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                    const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                })
                const masAssetsSwap = [a3];
                const masValuesSwap = [100*decimal];
                await step(`beforeEach: swap after deposit`, async () => {
                    await swap(
                        a2.assetId,
                        1*decimal,
                        convertToMasPayments(masAssetsSwap, masValuesSwap),
                        user,
                        contract
                    )
                    let assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    outConsoleOrAllure('beforeEach: assetBalances after first swap: ', assetBalances);
                    await swap(
                        a3.assetId,
                        1*decimal,
                        convertToMasPayments([a2], [100*decimal*2]),
                        user,
                        contract
                    )
                    assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                    outConsoleOrAllure('beforeEach: assetBalances after second swap: ', assetBalances);
                })

                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[+] try one stake when the pull have fee inside', async () => {
                const paymentAmount = 100;
                const [stakedBalanceSum,totalLpSum] = await calculatorSwap.calculateStake(user,paymentAmount)
                const transaction = await stake(
                    [{assetId: lpToken.assetId, amount: paymentAmount}],
                    user,
                    contract
                )
                const height = getHeightFromTransaction(transaction)
                const state = await calculatorSwap.getStateForStaking([user],[lpToken])
                outConsoleOrAllure('state: ', state);
                // expect(state.ASSETS).to.be.equal(`${a2.assetId}__${a3.assetId}`)
                expect(state.TOTAL_LP).to.be.equal(totalLpSum)
                expect(state.USER_LP[0]).to.be.equal(paymentAmount)
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11)
                expect(totalLpSum).to.be.equal(paymentAmount)
                expect(stakedBalanceSum).to.be.equal(paymentAmount)
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(defaultZERO11)
            })
            it('[+] try stake before withdraw, checkpoint',async () => {
                const paymentAmount = 1;
                const masCommand =[
                    {name: 'depositAll',depositAmount:200,masAssetsPayment:[a2,a3],masValuesPayment:[200,200],user:user},
                    {name: 'deposit',depositAmount:200,masAssetsPayment:[a2],masValuesPayment:[200],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[paymentAmount],user:user},
                    {name: 'withdraw',assetId: a2.assetId,withdrawAmount:30,masAssetsPayment:[lpToken],masValuesPayment:[50],user:user3},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                ]
                const {resultForTable,height} = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user],[lpToken])
                outConsoleOrAllure('state: ', state);
                expect(state.TOTAL_LP).to.be.equal(paymentAmount)
                expect(state.USER_LP[0]).to.be.equal(paymentAmount)
                expect(state.LP_FEE[0]).to.be.equal(4)
                expect(state.PROTOCOL_FEE[0]).to.be.equal(8)
                expect(state.USER_PROFITS[0]).to.be.equal('4__0__0__0__0__0__0__0__0__0__0')
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('4000000000000__0__0__0__0__0__0__0__0__0__0')
                expect(state.SIGMA_FEE_PER_LP).to.be.equal('4000000000000__0__0__0__0__0__0__0__0__0__0')
            })
        })
        describe('stake new: ',function () {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user3.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user4.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user5.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
            })
            it('[+] stake before depositAll,deposit',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                expect(state.ASSET_BALANCES).to.be.equal('2500__500');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(defaultZERO11);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(defaultZERO11);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before withdrawAll',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2471__495');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before withdraw',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdraw',assetId: a2.assetId,withdrawAmount:30,masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2470__500');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before swap(a2->a3)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2400__600');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before swap(a3->a2)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2600__400');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(10);;
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(20);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2) by two users(same amount staked lp)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(20);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(10);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2) by two users(different amount staked lp)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(50);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(40);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2) by two users(staking user2 after withdrawAll)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(50);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(40);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2) by two users(staking user2 after swap(a2->a3))',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(50);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(40);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] staking by two users + second stake - check state without checkpoint',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2600__400');
                expect(state.TOTAL_LP).to.be.equal(100);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp2);// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(20);
                expect(state.USER_LP[1]).to.be.equal(80);
                expect(state.USER_PROFITS[0]).to.be.equal('0__2__0__0__0__0__0__0__0__0__0');
                expect(state.USER_PROFITS[1]).to.be.equal('0__8__13__0__0__0__0__0__0__0__0');
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('0__200000000000__0__0__0__0__0__0__0__0__0');
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal('0__200000000000__333333333333__0__0__0__0__0__0__0__0');
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
        })
        describe('unstake when the pull empty: ',function () {
            let lpToken: Asset;
            const initDepositAmount = 200;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [100,100]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const masCommand =[
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user2},
                    ]
                    const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            it('[-] try unstake amount is -1', async () => {
                await stepIgnoreErrorByMessage('unstake',
                    `Error while executing dApp: unstake: invalid amount`,
                    async () => {
                        await unstake(
                            -1,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
                })
            })
            it('[+] try unstake amount is 0', async () => {
                await step('unstake',
                    async () => {
                        await unstake(
                            0,
                            user,
                            contract
                        )
                    })
                await step('unstake',
                    async () => {
                        await unstake(
                            0,
                            user,
                            contract
                        )
                    })
                const state = await calculatorSwap.getStateForStaking([user],[lpToken])
                outConsoleOrAllure('state: ',state)
                expect(state.ASSET_BALANCES).to.be.equal('200__200')
                expect(state.TOTAL_LP).to.be.equal(0)
                expect(state.USER_LP[0]).to.be.equal(0)
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11)
                expect(state.USER_SIGMA_FEE_PER_LP).to.be.not.equal(defaultZERO11)
            })
            it('[-] try unstake amount more than userLp', async () => {
                await stepIgnoreErrorByMessage('unstake',
                    `Error while executing dApp: unstake: invalid amount`,
                    async () => {
                        await unstake(
                            1,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
                })
            })
            it('[-] try unstake amount=(MAX_INT+1n) more than userLp', async () => {
                await stepIgnoreErrorByMessage('unstake',
                    `Error while executing dApp: unstake: invalid amount`,
                    async () => {
                        await unstake(
                            MAX_INT+1n,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
                })
            })
        })
        describe('unstake when the pull not empty,have fee inside the pull: ',function () {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user3.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user4.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user5.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
            })
            it('[+] unstake after (stake before withdrawAll,swap(a2->a3),swap(a3->a2))',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                    {name: 'unstake',unstakeAmount:4,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(10-4);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10-4);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] unstake after (stake before withdrawAll,swap(a2->a3),swap(a3->a2)+stake)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                    {name: 'unstake',unstakeAmount:4,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(20-4);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(20-4);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2)+unstake+swap+swap',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'unstake',unstakeAmount:4,user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2671__297');
                expect(state.TOTAL_LP).to.be.equal(40-4);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(20-4);
                expect(state.USER_LP[1]).to.be.equal(20);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(20);
                expect(state.LP_FEE[1]).to.be.equal(39);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(40);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(79);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2)+unstake+swap+swap+stake+stake)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'unstake',unstakeAmount:10,user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2671__297');
                expect(state.TOTAL_LP).to.be.equal(40-10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(20-10);
                expect(state.USER_LP[1]).to.be.equal(20);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(20);
                expect(state.LP_FEE[1]).to.be.equal(39);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(40);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(79);
            });
            it('[+] stake before withdrawAll,swap(a2->a3),swap(a3->a2)+unstake(100%)+swap+swap+unstake(50%)+...)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'unstake',unstakeAmount:10,user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'unstake',unstakeAmount:5,user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2640__294');
                expect(state.TOTAL_LP).to.be.equal(25);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(15);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(profitUpdated2);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(20);
                expect(state.LP_FEE[1]).to.be.equal(39);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(40);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(79);
            });
            it('[-] unstake more than is having lp',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user},
                    {name: 'unstake',unstakeAmount:1,user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2571__395');
                expect(state.TOTAL_LP).to.be.equal(10-1);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10-1);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
                await stepIgnoreErrorByMessage('unstake',
                    `Error while executing dApp: unstake: invalid amount`,
                    async () => {
                        await unstake(
                            10,
                            user,
                            contract
                        )
                    })
            });
        })
        describe('claim when the pull is empty: ',function () {
            let lpToken: Asset;
            const initDepositAmount = 200;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masAssetsPayment = [a2,a3];
                const initAssetWeight = [50,50]
                await step(`beforeEach: init the pull with assetWeight "${initAssetWeight}"`, async () => {
                    await init(
                        convertList2MapList(masAssetsPayment.map((x) => {return x.assetId})),
                        convertList2MapList(initAssetWeight.map(String)),
                        100000,
                        200000,
                        'pepeToken',
                        'pepe Reward Token',
                        8,
                        800000,
                        750000,
                        300,
                        400,
                        protocolFeeContract.address,
                        sender,
                        contract
                    )
                })
                let storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('storage after init: ', storage);
                let lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                outConsoleOrAllure('lpTokenInfo after init: ', lpTokenInfo)
                const masValuesPaymentIntoEmptyPull = [100,100]
                await step(`beforeEach: depositAll after init with values "${masValuesPaymentIntoEmptyPull}"`, async () => {
                    const masCommand =[
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user},
                        {name: 'depositAll',depositAmount:initDepositAmount,masAssetsPayment:masAssetsPayment,masValuesPayment:masValuesPaymentIntoEmptyPull,user:user2},
                    ]
                    const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                })
                storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                outConsoleOrAllure('beforeEach: storage[\'lpTotalSupply\'] after deposit: ', storage['lpTotalSupply']);
                const assetBalances = parseASSET_BALANCES(await getDataValue(contract, key_ASSET_BALANCES, env.network));
                outConsoleOrAllure('beforeEach: assetBalances after deposit: ', assetBalances);
                lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                lpToken = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
            });
            // it('[-] try claim amount is -1', async () => {
            //     await stepIgnoreErrorByMessage('claim',
            //         `Error while executing dApp: claim: invalid amount`,
            //         async () => {
            //             await claim(
            //                 '',
            //                 a2.assetId,
            //                 -1,
            //                 user,
            //                 contract
            //             )
            //         })
            //     const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            //     await step('check state', async () => {
            //         expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
            //     })
            // })
            // it('[+] try claim amount is 0', async () => {
            //     await step('claim',
            //         async () => {
            //             await claim(
            //                 '',
            //                 a2.assetId,
            //                 0,
            //                 user,
            //                 contract
            //             )
            //         })
            //     const state = await calculatorSwap.getStateForStaking([user],[lpToken])
            //     outConsoleOrAllure('state: ',state)
            //     expect(state.ASSET_BALANCES).to.be.equal('200__200')
            //     expect(state.TOTAL_LP).to.be.equal(0)
            //     expect(state.USER_LP[0]).to.be.equal(0)
            //     expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11)
            //     expect(state.USER_SIGMA_FEE_PER_LP).to.be.not.equal(defaultZERO11)
            // })
            // it('[-] try claim amount more than userLp', async () => {
            //     await stepIgnoreErrorByMessage('claim',
            //         `Error while executing dApp: claim: insufficient amount`,
            //         async () => {
            //             await claim(
            //                 '',
            //                 a2.assetId,
            //                 10000000000,
            //                 user,
            //                 contract
            //             )
            //         })
            //     const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            //     await step('check state', async () => {
            //         expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
            //     })
            // })
            // it('[-] try claim amount=(MAX_INT+1n) more than userLp', async () => {
            //     await stepIgnoreErrorByMessage('claim',
            //         `Error while executing dApp: claim: invalid amount`,
            //         async () => {
            //             await claim(
            //                 '',
            //                 a2.assetId,
            //                 MAX_INT+1n,
            //                 user,
            //                 contract
            //             )
            //         })
            //     const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            //     await step('check state', async () => {
            //         expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
            //     })
            // })
            // it('[-] try claim amount=MAX_INT more than userLp', async () => {
            //     await stepIgnoreErrorByMessage('claim',
            //         `Error while executing dApp: claim: insufficient amount`,
            //         async () => {
            //             await claim(
            //                 '',
            //                 a2.assetId,
            //                 MAX_INT,
            //                 user,
            //                 contract
            //             )
            //         })
            //     const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            //     await step('check state', async () => {
            //         expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
            //     })
            // })

            it('[-] try claim when assets is empty', async () => {
                await stepIgnoreErrorByMessage('claim',
                    `Error while executing dApp: claim: invalid assets size`,
                    async () => {
                        await claim(
                            '',
                            convertList2MapList([]),
                            //0,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
                })
            })
            it('[-] try claim assetId invalid', async () => {
                await step('claim',
                    // `Error while executing dApp: claim: invalid assetId`,
                    async () => {
                        await claim(
                            '',
                            convertList2MapList([a4.assetId]),
                            //0,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
                })
            })
            it('[-] try claim when user for claim is invalid', async () => {
                await stepIgnoreErrorByMessage('claim',
                    `Error while executing dApp: claim: invalid user`,
                    async () => {
                        await claim(
                            'qwerty',
                            convertList2MapList([a2.assetId]),
                            //0,
                            user,
                            contract
                        )
                    })
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                await step('check state', async () => {
                    expect(storage.lpTotalSupply).to.be.equal(initDepositAmount * 2);
                })
            })
        })
        describe('claim when the pull not empty,have fee inside the pull: ',function () {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user3.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user3.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user4.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user4.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user5.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user5.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
            })
            it('[+] stake before withdrawAll+claim',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const lpToken1 = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
                outConsoleOrAllure('lpToken.assetId: ', lpToken1.assetId);
                let stateBeforeClaim = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('stateBeforeClaim: ', stateBeforeClaim);
                expect(stateBeforeClaim.USER_PROFITS[0]).to.be.equal('5__0__0__0__0__0__0__0__0__0__0');
                const transaction = await claim(
                    '',
                    convertList2MapList([lpToken1.assetId]),
                    user,
                    contract
                )
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);

                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[lpToken1],lpTokenInfo.assetId)
                expect(sendLpToken).to.be.equal(5)
                expect(state.ASSET_BALANCES).to.be.equal('2471__495');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before withdrawAll+claim for other user',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'claim',userForClaim:user2.address,assets:[a3.assetId],user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2600__400');
                expect(state.TOTAL_LP).to.be.equal(100);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp2);// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(20);
                expect(state.USER_LP[1]).to.be.equal(80);
                expect(state.USER_PROFITS[0]).to.be.equal('0__2__0__0__0__0__0__0__0__0__0');
                expect(state.USER_PROFITS[1]).to.be.equal(`0__8__${0}__0__0__0__0__0__0__0__0`);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('0__200000000000__0__0__0__0__0__0__0__0__0');
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal('0__200000000000__333333333333__0__0__0__0__0__0__0__0');
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] stake before withdrawAll+claim by user that do not have profits',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const lpToken1 = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
                outConsoleOrAllure('lpToken.assetId: ', lpToken1.assetId);
                let state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const transaction = await claim(
                    user2.address,
                    convertList2MapList([lpToken1.assetId]),
                    //0,
                    user,
                    contract
                )

                state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                expect(masReturnFunds).to.be.deep.equal([0,0])
                expect(sendLpToken).to.be.equal(0)
                expect(state.ASSET_BALANCES).to.be.equal('2471__495');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before swap(a2->a3)+claim',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const lpToken1 = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
                outConsoleOrAllure('lpToken.assetId: ', lpToken1.assetId);
                const stateBeforeClaim = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('stateBeforeClaim: ', stateBeforeClaim);
                const transaction = await claim(
                    '',
                    convertList2MapList([a2.assetId]),
                    user,
                    contract
                )
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                outConsoleOrAllure('masReturnFunds: ', masReturnFunds);
                outConsoleOrAllure('sendLpToken: ', sendLpToken);
                expect(sendLpToken).to.be.deep.equal(0)
                expect(masReturnFunds).to.be.deep.equal([10,0])
                expect(state.ASSET_BALANCES).to.be.equal('2400__600');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(0);
            });
            it('[+] stake before swap(a3->a2)+claim',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const lpToken1 = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
                outConsoleOrAllure('lpToken.assetId: ', lpToken1.assetId);
                const stateBeforeClaim = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('stateBeforeClaim: ', stateBeforeClaim);
                const transaction = await claim(
                    '',
                    convertList2MapList([a3.assetId]),
                    user,
                    contract
                )
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
                outConsoleOrAllure('masReturnFunds: ', masReturnFunds);
                outConsoleOrAllure('sendLpToken: ', sendLpToken);
                expect(sendLpToken).to.be.deep.equal(0)
                expect(masReturnFunds).to.be.deep.equal([0,10])
                expect(state.ASSET_BALANCES).to.be.equal('2600__400');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[1]).to.be.equal(10);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(20);
            });
            it('[+] the pull with assets(a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) stake+claim',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3,a4,a5,a6,a7,a8,a9,a10,a11],
                        assetWeights:[50,50,50,50,50,50,50,50,50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3,a4,a5,a6,a7,a8,a9,a10,a11],masValuesPayment:[500,500,500,500,500,500,500,500,500,500],user:user},
                    {name: 'deposit',depositAmount:20,masAssetsPayment:[a2],masValuesPayment:[20],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a11.assetId,minAmount:1,masAssetsPayment:[a10],masValuesPayment:[50],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const lpToken1 = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
                outConsoleOrAllure('lpToken.assetId: ', lpToken1.assetId);
                const stateBeforeClaim = await calculatorSwap.getStateForStaking([user,user2],[a2,a3,a4,a5,a6,a7,a8,a9,a10,a11])
                outConsoleOrAllure('stateBeforeClaim: ', stateBeforeClaim);
                const transaction = await claim(
                    '',
                    convertList2MapList([a4.assetId,a7.assetId,lpToken1.assetId,a11.assetId]),
                    user,
                    contract
                )
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3,a4,a5,a6,a7,a8,a9,a10,a11])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3,a4,a5,a6,a7,a8,a9,a10,a11],lpTokenInfo.assetId)
                outConsoleOrAllure('masReturnFunds: ', masReturnFunds);
                outConsoleOrAllure('sendLpToken: ', sendLpToken);
                expect(sendLpToken).to.be.deep.equal(0)
                expect(masReturnFunds).to.be.deep.equal([0,0,0,0,0,0,0,0,0,5])
                expect(state.ASSET_BALANCES).to.be.equal('120__100__100__100__100__100__100__100__150__50');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_LP[1]).to.be.equal(0);
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11);
                expect(state.USER_PROFITS[1]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(userSigmaFeePerLp1);
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal(userSigmaFeePerLp2);
                expect(state.LP_FEE[0]).to.be.equal(0);
                expect(state.LP_FEE[9]).to.be.equal(5);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(0);
                expect(state.PROTOCOL_FEE[9]).to.be.equal(10);
            });
            it('[+] staking by two users + second stake - claim by second user',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[200],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'claim',userForClaim:'',assets:[a3.assetId],user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(state.ASSET_BALANCES).to.be.equal('2600__400');
                expect(state.TOTAL_LP).to.be.equal(100);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp2);// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(20);
                expect(state.USER_LP[1]).to.be.equal(80);
                expect(state.USER_PROFITS[0]).to.be.equal('0__2__0__0__0__0__0__0__0__0__0');
                expect(state.USER_PROFITS[1]).to.be.equal(`0__8__${0}__0__0__0__0__0__0__0__0`);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('0__200000000000__0__0__0__0__0__0__0__0__0');
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal('0__200000000000__333333333333__0__0__0__0__0__0__0__0');
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
            it('[+] staking by two users - claim assets(a2,a3,lpToken)',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                    {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user2},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user},
                    {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
                const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                const lpToken1 = {
                    name: lpTokenInfo.name,
                    description: lpTokenInfo.description,
                    quantity: lpTokenInfo.quantity as number,
                    decimals: lpTokenInfo.decimals,
                    assetId: lpTokenInfo.assetId
                }
                const stateBeforeClaim = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('stateBeforeClaim: ', stateBeforeClaim);
                const transaction = await claim(
                    '',
                    convertList2MapList([a3.assetId,lpToken1.assetId,a2.assetId]),
                    user2,
                    contract
                )
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpToken1.assetId)
                outConsoleOrAllure('masReturnFunds: ', masReturnFunds);
                outConsoleOrAllure('sendLpToken: ', sendLpToken);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                outConsoleOrAllure(`profitUpdated1: `,profitUpdated1)
                outConsoleOrAllure(`userSigmaFeePerLp1: `,userSigmaFeePerLp1);
                const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
                outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
                outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
                expect(sendLpToken).to.be.deep.equal(8)
                expect(masReturnFunds).to.be.deep.equal([16,13])
                expect(state.ASSET_BALANCES).to.be.equal('2442__490');
                expect(state.TOTAL_LP).to.be.equal(100);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal(userSigmaFeePerLp2);// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(20);
                expect(state.USER_LP[1]).to.be.equal(80);
                expect(state.USER_PROFITS[0]).to.be.equal('2__4__0__0__0__0__0__0__0__0__0');
                expect(state.USER_PROFITS[1]).to.be.equal(`0__0__0__0__0__0__0__0__0__0__0`);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('200000000000__400000000000__0__0__0__0__0__0__0__0__0');
                expect(state.USER_SIGMA_FEE_PER_LP[1]).to.be.equal('200000000000__400000000000__333333333332__0__0__0__0__0__0__0__0');
                expect(state.LP_FEE[0]).to.be.equal(20);
                expect(state.LP_FEE[1]).to.be.equal(20);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(40);
                expect(state.PROTOCOL_FEE[1]).to.be.equal(40);
            });
        })
        describe('check checkpoint: ', async () => {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
            });
            it('[+] staking - check state without checkpoint',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                expect(state.ASSET_BALANCES).to.be.equal('2400__600');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal('0__1000000000000__0__0__0__0__0__0__0__0__0');// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_PROFITS[0]).to.be.equal(defaultZERO11);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal(defaultZERO11);
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
            });
            it('[+] staking - check state with checkpoint',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                expect(state.ASSET_BALANCES).to.be.equal('2400__600');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal('0__1000000000000__0__0__0__0__0__0__0__0__0');// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('0__1000000000000__0__0__0__0__0__0__0__0__0');
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
            });
            it('[+] staking - check state with checkpoint by other user',async ()=> {
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                    {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user2},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
                const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
                outConsoleOrAllure('state: ', state);
                const [profitUpdated1,userSigmaFeePerLp1] = await calculatorSwap.calculateCheckpoint(user)
                 outConsoleOrAllure('profitUpdated1: ',profitUpdated1)
                outConsoleOrAllure('userSigmaFeePerLp1: ',userSigmaFeePerLp1);
                expect(state.ASSET_BALANCES).to.be.equal('2400__600');
                expect(state.TOTAL_LP).to.be.equal(10);
                expect(state.SIGMA_FEE_PER_LP).to.be.equal('0__1000000000000__0__0__0__0__0__0__0__0__0');// last value state when user2 made stake
                expect(state.USER_LP[0]).to.be.equal(10);
                expect(state.USER_PROFITS[0]).to.be.equal(profitUpdated1);
                expect(state.USER_SIGMA_FEE_PER_LP[0]).to.be.equal('0__1000000000000__0__0__0__0__0__0__0__0__0');
                expect(state.LP_FEE[0]).to.be.equal(10);
                expect(state.PROTOCOL_FEE[0]).to.be.equal(20);
            });
        })
    })

    describe('check evaluate functions: ',function () {
        let lpToken: Asset;
        beforeEach(async () => {
            await step('set state before staking...', async () => {
                await setContractState(
                    {
                        data: [
                            {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                            {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                            {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                            {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                            {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_LP__${user3.address}`, type: 'integer', value: '0'},
                            {key: `USER_PROFITS__${user3.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_SIGMA_FEE_PER_LP__${user3.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_LP__${user4.address}`, type: 'integer', value: '0'},
                            {key: `USER_PROFITS__${user4.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_SIGMA_FEE_PER_LP__${user4.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_LP__${user5.address}`, type: 'integer', value: '0'},
                            {key: `USER_PROFITS__${user5.address}`, type: 'string', value: defaultZERO11},
                            {key: `USER_SIGMA_FEE_PER_LP__${user5.address}`, type: 'string', value: defaultZERO11},
                            {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                            {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                            {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                            {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                        ]
                    },
                    {privateKey: contract.privateKey},
                    env.network
                );
            });
        })
        it('[+] checking of getting values getFunctions', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[30],user:user2},
                {name: 'withdraw',assetId: a2.assetId,withdrawAmount:30,masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user},
                {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user2},
                // {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[20],user:user},
                {name: 'checkpoint',userAddressForCheckpoint:user.address,user:user},
                {name: 'checkpoint',userAddressForCheckpoint:user2.address,user:user2},
            ]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            let res;
            res = await fetchEvaluateSwap(contract.dApp,'getDepositAll',[200])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.lpTokensToMint).to.be.not.null
            expect(res?.requiredAmountsNormalized).to.be.not.null
            res = await fetchEvaluateSwap(contract.dApp,'getDeposit',[a3.assetId,15])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.lpTokensToMint).to.be.not.null
            res = await fetchEvaluateSwap(contract.dApp,'getWithdrawAll',[17])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.balancesToGet).to.be.not.null
            res = await fetchEvaluateSwap(contract.dApp,'getWithdraw',[a2.assetId,150])//lp ????????? Error???
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.requiredLpTokens).to.be.not.null
            res = await fetchEvaluateSwap(contract.dApp,'getSwap',[a2.assetId,a3.assetId,100])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.finalAmount).to.be.not.null
            res = await fetchEvaluateSwap(contract.dApp,'getClaim',[user.address])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.userProfits).to.be.not.null
        });
        it('[+] check getDepositAll', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
            ]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            const depositAmount = 200;
            const res = await fetchEvaluateSwap(contract.dApp,'getDepositAll',[depositAmount])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.lpTokensToMint).to.be.not.null
            expect(res?.requiredAmountsNormalized).to.be.not.null
            const masAssetsPayment = [a2, a3];
            const masValuesPayment = res?.requiredAmountsNormalized//[100, 100];
            const transaction: InvokeScriptTransactionFromNode = await depositAll(
                depositAmount,
                convertToMasPayments(masAssetsPayment, masValuesPayment),
                user,
                contract
            )
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
            const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
            expect(res?.lpTokensToMint).to.be.equal(sendLpToken)
            expect(masReturnFunds).to.be.deep.equal([0,0])
        });
        it('[+] check getDeposit', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
            ]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            const depositAmount = 200;
            const res = await fetchEvaluateSwap(contract.dApp,'getDeposit',[a3.assetId,depositAmount])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.lpTokensToMint).to.be.not.null
            const masAssetsPayment = [a3];
            const masValuesPayment = [depositAmount];
            const transaction: InvokeScriptTransactionFromNode = await deposit(
                res?.lpTokensToMint,
                convertToMasPayments(masAssetsPayment, masValuesPayment),
                user,
                contract
            )
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
            const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,masAssetsPayment,lpTokenInfo.assetId)
            expect(res?.lpTokensToMint).to.be.equal(sendLpToken)
            expect(masReturnFunds).to.be.deep.equal([0])
        });
        it('[+] check getWithdrawAll', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
            ]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            const withdrawAmount = 200;
            const res = await fetchEvaluateSwap(contract.dApp,'getWithdrawAll', [withdrawAmount])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.balancesToGet).to.be.not.null
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
            const lpToken = {
                name: lpTokenInfo.name,
                description: lpTokenInfo.description,
                quantity: lpTokenInfo.quantity as number,
                decimals: lpTokenInfo.decimals,
                assetId: lpTokenInfo.assetId
            }
            const masAssetsPayment = [lpToken];
            const masValuesPayment = [withdrawAmount]//[100, 100];
            const transaction: InvokeScriptTransactionFromNode = await withdrawAll(
                convertToMasPayments(masAssetsPayment, masValuesPayment),
                user,
                contract
            )
            const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpTokenInfo.assetId)
            expect(sendLpToken).to.be.equal(0)
            expect(masReturnFunds).to.be.deep.equal(res?.balancesToGet)
        });
        it('[+] check getWithdraw', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
            ]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
            const lpToken = {
                name: lpTokenInfo.name,
                description: lpTokenInfo.description,
                quantity: lpTokenInfo.quantity as number,
                decimals: lpTokenInfo.decimals,
                assetId: lpTokenInfo.assetId
            }
            const withdrawAmount = 150;
            const res = await fetchEvaluateSwap(contract.dApp,'getWithdraw', [a2.assetId,withdrawAmount])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.requiredLpTokens).to.be.not.null
            const transaction: InvokeScriptTransactionFromNode = await withdraw(
                a2.assetId,
                withdrawAmount,
                [
                    {assetId: lpToken.assetId, amount: res?.requiredLpTokens}
                ],
                user,
                contract
            )
            const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpToken.assetId)
            expect(sendLpToken).to.be.equal(0)
            expect(masReturnFunds).to.be.deep.equal([withdrawAmount,0])
        });
        it('[+] check getSwap', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
            ]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
            const lpToken = {
                name: lpTokenInfo.name,
                description: lpTokenInfo.description,
                quantity: lpTokenInfo.quantity as number,
                decimals: lpTokenInfo.decimals,
                assetId: lpTokenInfo.assetId
            }
            const swapAmount = 30;
            const res = await fetchEvaluateSwap(contract.dApp,'getSwap', [a2.assetId,a3.assetId,swapAmount])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.finalAmount).to.be.not.null
            const masAssetsPayment=[a3]
            const masValuesPayment=[swapAmount]
            const transaction = await swap(
                a2.assetId,
                1,
                convertToMasPayments(masAssetsPayment, masValuesPayment),
                user,
                contract
            )
            const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpToken.assetId)
            outConsoleOrAllure('masReturnFunds: ',masReturnFunds)
            outConsoleOrAllure('sendLpToken: ',sendLpToken)
            expect(sendLpToken).to.be.equal(0)
            expect(masReturnFunds).to.be.deep.equal([res?.finalAmount,0])
        });
        it('[+] check getClaim', async () => {
            const masCommand =[
                {name: 'init',
                    assets:[a2,a3],
                    assetWeights:[50,50],
                    lpFeeRate:100000,
                    protocolFeeRate:200000,
                    lpTokenName:'pepeToken',
                    lpTokenDescr:'pepe Reward Token',
                    lpTokenDecimals:8,
                    maxAllocationAmplifier:800000,
                    weightAmplifier:750000,
                    slippageRate:300000,
                    feeMaxRate:400000,
                    protocolFeeContract:protocolFeeContract.address,
                    user:user},
                {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2},
                {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user},
                {name: 'withdrawAll',masAssetsPayment:[lpToken],masValuesPayment:[50],user:user2},
                {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user2},
                {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user},
                {name: 'swap',targetAssetId:a3.assetId,minAmount:1,masAssetsPayment:[a2],masValuesPayment:[100],user:user2},
                {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[40],user:user2}]
            const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            const storage = parseSTORAGE(await getDataValue(contract, key_STORAGE, env.network));
            const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
            const lpToken1 = {
                name: lpTokenInfo.name,
                description: lpTokenInfo.description,
                quantity: lpTokenInfo.quantity as number,
                decimals: lpTokenInfo.decimals,
                assetId: lpTokenInfo.assetId
            }
            const stateBeforeClaim = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
            outConsoleOrAllure('stateBeforeClaim: ', stateBeforeClaim);
            const res = await fetchEvaluateSwap(contract.dApp,'getClaim', [user2.address])
            outConsoleOrAllure('res: ',JSON.stringify(res))
            expect(res?.userProfits).to.be.not.null
            const state = await calculatorSwap.getStateForStaking([user,user2],[a2,a3])
            outConsoleOrAllure('state: ', state);
            const [profitUpdated2,userSigmaFeePerLp2] = await calculatorSwap.calculateCheckpoint(user2)
            outConsoleOrAllure(`profitUpdated2: `,profitUpdated2)
            outConsoleOrAllure(`userSigmaFeePerLp2: `,userSigmaFeePerLp2);
            const transaction = await claim(
                '',
                convertList2MapList([a3.assetId,lpToken1.assetId,a2.assetId]),
                user2,
                contract
            )
            const [masReturnFunds,sendLpToken] = findTransferToUserIntoTransaction(transaction,[a2,a3],lpToken1.assetId)
            outConsoleOrAllure('masReturnFunds: ', masReturnFunds);
            outConsoleOrAllure('sendLpToken: ', sendLpToken);
            expect(sendLpToken).to.be.deep.equal(8)
            expect(masReturnFunds).to.be.deep.equal([16,13])
            expect(res?.userProfits).to.be.deep.equal([sendLpToken,masReturnFunds[0],masReturnFunds[1],0,0,0,0,0,0,0,0])
        });
    })

    describe('check pause/unpause/updatePauser functions: ',function () {
        after(async () => {
            await step('set state before staking...', async () => {
                await setContractState(
                    {
                        data: [
                            {key: KEY_PAUSED, type: 'boolean', value: false},
                        ]
                    },
                    {privateKey: contract.privateKey},
                    env.network
                );
            });
        })
        describe('check pause/unpause functions when Pauser is not set: ',function () {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: KEY_PAUSED, type: 'boolean', value: false},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            });
            it('[-] try pause functions', async () => {
                await stepIgnoreErrorByMessage('try pause',
                    'Error while executing dApp: _onlyPauser: revert',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.null;
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            });
            it('[-] try unpause functions', async () => {
                await stepIgnoreErrorByMessage('try unpause',
                    'Error while executing dApp: _onlyPauser: revert',
                    async () => {
                        await unpause(
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.null;
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            })
            it('[-] try updatePauser functions', async () => {
                await stepIgnoreErrorByMessage('try unpause',
                    'Error while executing dApp: _onlyThisContract: revert',
                    async () => {
                        await updatePauser(
                            '',
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.null;
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            })
            it('[-] try invalid updatePauser 1', async () => {
                await stepIgnoreErrorByMessage('try updatePauser',
                    'Error while executing dApp: _onlyThisContract: revert',
                    async () => {
                        await updatePauser(
                            'qwerewrtewt',
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.null;
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            })
            it('[-] try invalid updatePauser 2', async () => {
                await stepIgnoreErrorByMessage('try updatePauser',
                    'Error while executing dApp: _onlyThisContract: revert',
                    async () => {
                        await updatePauser(
                            user.address,
                            user2,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.null;
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            })
        })
        describe('check pause/unpause/updatePauser functions when the pull is not init: ',function () {
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                { key: 'STORAGE', type: 'string',
                                    value: `__0__100__100000__100000__1000000__500000__50000__100000__${userForGarbageMoney.address}`},
                                {key: KEY_PAUSER, type: 'string', value: user.address},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
            });
            it('[-] try updatePauser', async () => {
                await stepIgnoreErrorByMessage('try updatePauser',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
            })
            it('[-] try pause ', async () => {
                await stepIgnoreErrorByMessage('try pause',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                })
            });
            it('[-] try unpause ', async () => {
                await stepIgnoreErrorByMessage('try pause',
                    'Error while executing dApp: _whenInitialized: revert',
                    async () => {
                        await unpause(
                            user,
                            contract
                        )
                    })
            });
        })
        describe('check pause/unpause functions when Pauser is set: ',function () {
            let lpToken: Asset;
            beforeEach(async () => {
                await step('set state before staking...', async () => {
                    await setContractState(
                        {
                            data: [
                                {key: KEY_TOTAL_LP, type: 'integer', value: '0'},
                                {key: KEY_SIGMA_FEE_PER_LP, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_LP__${user2.address}`, type: 'integer', value: '0'},
                                {key: `USER_PROFITS__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `USER_SIGMA_FEE_PER_LP__${user2.address}`, type: 'string', value: defaultZERO11},
                                {key: `LP_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `LP_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a2.assetId}`, type: 'integer', value: 0},
                                {key: `PROTOCOL_FEE__${a3.assetId}`, type: 'integer', value: 0},
                                {key: KEY_PAUSED, type: 'boolean', value: false},
                                {key: KEY_PAUSER, type: 'string', value: ''},
                            ]
                        },
                        {privateKey: contract.privateKey},
                        env.network
                    );
                });
                const masCommand =[
                    {name: 'init',
                        assets:[a2,a3],
                        assetWeights:[50,50],
                        lpFeeRate:100000,
                        protocolFeeRate:200000,
                        lpTokenName:'pepeToken',
                        lpTokenDescr:'pepe Reward Token',
                        lpTokenDecimals:8,
                        maxAllocationAmplifier:800000,
                        weightAmplifier:750000,
                        slippageRate:300000,
                        feeMaxRate:400000,
                        protocolFeeContract:protocolFeeContract.address,
                        user:user},
                    {name: 'depositAll',depositAmount:1000,masAssetsPayment:[a2,a3],masValuesPayment:[500,500],user:user},
                    {name: 'deposit',depositAmount:2000,masAssetsPayment:[a2],masValuesPayment:[2000],user:user2},
                    {name: 'stake',masAssetsPayment:[lpToken],masValuesPayment:[10],user:user},
                    {name: 'swap',targetAssetId:a2.assetId,minAmount:1,masAssetsPayment:[a3],masValuesPayment:[100],user:user},
                ]
                const resultForTable = await calculatorSwap.runCommandToSwapAndGetState(masCommand);
            });
            it('[+] try updatePauser', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            })
            it('[+] try second time to set updatePauser', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await step('try updatePauser2',
                    async () => {
                        await updatePauser(
                            user2.address,
                            contract,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user2.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            })
            it('[+] try pause after setting updatePauser', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await step('try pause',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.true;
                });
            });
            it('[+] try unpause after setting updatePauser', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await step('try pause',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                    })
                await step('try unpause',
                    async () => {
                        await unpause(
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            });
            it('[-] try pause second time - _whenNotPaused: revert', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await step('try pause',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                    })
                await stepIgnoreErrorByMessage('try pause',
                    'Error while executing dApp: _whenNotPaused: revert',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.true;
                });
            });
            it('[-] try unpause when not paused - _whenPaused: revert', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await stepIgnoreErrorByMessage('try unpause',
                    'Error while executing dApp: _whenPaused: revert',
                    async () => {
                        await unpause(
                            user,
                            contract
                        )
                    });
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            });
            it('[-] try pause by invalid user', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await stepIgnoreErrorByMessage('try pause',
                    'Error while executing dApp: _onlyPauser: revert',
                    async () => {
                        await pause(
                            user2,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.false;
                });
            });
            it('[-] try unpause by invalid user', async () => {
                await step('try updatePauser',
                    async () => {
                        await updatePauser(
                            user.address,
                            contract,
                            contract
                        )
                    })
                await step('try pause',
                    async () => {
                        await pause(
                            user,
                            contract
                        )
                    })
                await stepIgnoreErrorByMessage('try unpause',
                    'Error while executing dApp: _onlyPauser: revert',
                    async () => {
                        await unpause(
                            user2,
                            contract
                        )
                    })
                await step('check state', async () => {
                    expect(await getDataValue(contract, KEY_PAUSER, env.network)).to.be.equal(user.address);
                    expect(await getDataValue(contract, KEY_PAUSED, env.network)).to.be.true;
                });
            });
        })

    })
})
