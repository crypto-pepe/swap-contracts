import {Account, Asset, Contract, getDataValue, NetworkConfig} from "@pepe-team/waves-sc-test-utils";
import {nodeInteraction} from "@waves/waves-transactions";
import {fetchDetails} from "@waves/node-api-js/cjs/api-node/assets";
import {getAssetInfo} from "../../../steps/common";
import {
    convertList2MapList,
    convertToMasPayments,
    getHeightFromTransaction,
    outConsoleOrAllure,
} from "./helper";
import {allure} from "allure-mocha/runtime";
import {
    deposit,
    depositAll,
    withdraw,
    withdrawAll,
    swap,
    stake,
    unstake,
    claim,
    checkpoint,
    init
} from "../../../steps/crosschain.swap";


export type paramContract = {
    KEY_STORAGE : string;
    KEY_ASSETS : string;
    KEY_ASSET_BALANCES: string;
    KEY_ASSET_WEIGHTS : string;
    KEY_LP_FEE : string;
    KEY_PROTOCOL_FEE : string;
    KEY_STAKING_BALANCE : string;
    KEY_TOTAL_STAKING_BALANCE: string;
    SEP : string;
    WAVES : string;
    MAX_INT : bigint;
    MAX_FEE : number;
    MAX_AMPLIFIER : number;
    MAX_WEIGHT_AMPLIFIER : number;
    MAX_WEIGHT : number;
    SLIPPAGE_RATE_FACTOR : number;
    FEE_RATE_FACTOR : number;
    RATE_FACTOR : number;
    PERCENT_FACTOR : bigint;
    INT_DECIMALS : number
    BIGINT_DECIMALS : number;
    PRECISION : number
    LIST_25 : string;
    KEY_USER_LP : string;
    KEY_TOTAL_LP : string;
    KEY_USER_PROFITS : string;
    KEY_SIGMA_FEE_PER_LP :string;
    KEY_USER_SIGMA_FEE_PER_LP : string;
    KEY_PAUSED : string,
    KEY_PAUSER : string,
    defaultZERO11:string;
};

export class CalculatorSwapClass {
    contract: Contract;
    network: NetworkConfig;
    paramContract: paramContract;

    constructor(contract: Contract,network:NetworkConfig,paramContract:paramContract) {
        this.contract = contract;
        this.network = network;
        this.paramContract = paramContract;
    }

    async getSTORAGE() {
        const storageRaw =  await getDataValue(this.contract, this.paramContract.KEY_STORAGE, this.network) as string
        const items = storageRaw.split(this.paramContract.SEP)
        const storage : any = {}
        storage['lpAssetId'] = items[0];
        storage['unlocked'] = items[1];
        storage['lpTotalSupply'] = Number(items[2]);
        storage['lpFeeRate'] = Number(items[3]);
        storage['protocolFeeRate'] = Number(items[4]);
        storage['maxAllocationAmplifier'] = Number(items[5]);
        storage['weightAmplifier'] = Number(items[6]);
        storage['slippageRate'] = BigInt(items[7]);
        storage['feeMaxRate'] = BigInt(items[8]);
        return storage
    }

    async calculateDepositAll(masAssetsPayment:Asset[],masValuesPayment:number[],depositAmount:number):Promise<[number,number[],number,number[],number]>{
        outConsoleOrAllure('calculateDepositAll started...')
        const [assetWeights, sigmaWeight] = await this.getAssetWeightsAndSigma( this.paramContract.KEY_ASSET_WEIGHTS);
        outConsoleOrAllure('assetWeights', assetWeights);
        outConsoleOrAllure('sigmaWeight', sigmaWeight);
        const [prevAssetBalances, prevAssetTotalSupply] = await this.loadAssetBalances()
        outConsoleOrAllure('prevAssetBalances: ',prevAssetBalances);
        outConsoleOrAllure('prevAssetTotalSupply: ',prevAssetTotalSupply);
        const assetsPaymentValuesNormalized = await this.getAssetsPaymentNormalized(masAssetsPayment,masValuesPayment)
        outConsoleOrAllure('assetsPaymentValuesNormalized: ',assetsPaymentValuesNormalized)
        outConsoleOrAllure('masValuesPayment: ',masValuesPayment)
        const [masRequirementAmounts,masRequirementAmountsNormalized] = await this.getMasRequirementAmounts(masAssetsPayment,prevAssetBalances,assetWeights, prevAssetTotalSupply,depositAmount,sigmaWeight)
        outConsoleOrAllure('masRequirementAmounts: ',masRequirementAmounts)
        const masChange = this.getChange(masValuesPayment,masRequirementAmounts)//assetsPaymentValuesNormalized
        outConsoleOrAllure('masChange: ',masChange)
        const [assetBalances, assetTotalSupply] = await this.incrementBalancesByAmounts(prevAssetBalances,masRequirementAmountsNormalized,masAssetsPayment)
        outConsoleOrAllure('assetBalances: ',assetBalances)
        outConsoleOrAllure('assetTotalSupply: ',assetTotalSupply)
        const lpTokensToMint = await this.calculateLpTokensToMint(depositAmount,prevAssetTotalSupply)
        outConsoleOrAllure('lpTokensToMint: ',lpTokensToMint)
        const storage = await this.getSTORAGE()
        outConsoleOrAllure('lpTokenBefore: ', Number(storage['lpTotalSupply']))
        const invariant = this.validateLiquidityInvariant(
            prevAssetBalances,
            prevAssetTotalSupply,
            assetBalances,//after
            assetTotalSupply,//after
            Number(storage['lpTotalSupply']),
            Number(storage['lpTotalSupply']) + depositAmount,
            assetWeights,
            sigmaWeight,
            Number(storage['weightAmplifier']),
            Number(storage['slippageRate']),
            Number(storage['feeMaxRate'])
        )
        outConsoleOrAllure('invariant: ',invariant)
        outConsoleOrAllure('calculateDepositAll finished...');
        allure.createAttachment('masAssetsPayment', JSON.stringify(masAssetsPayment, null, 2),'application/json' as any);
        allure.createAttachment('masValuesPayment', JSON.stringify(masValuesPayment, null, 2),'application/json' as any);
        allure.createAttachment('depositAmount', JSON.stringify(depositAmount, null, 2),'application/json' as any);
        allure.createAttachment('assetWeights', JSON.stringify(assetWeights, null, 2),'application/json' as any);
        allure.createAttachment('sigmaWeight', JSON.stringify(sigmaWeight, null, 2),'application/json' as any);
        allure.createAttachment('prevAssetBalances', JSON.stringify(prevAssetBalances, null, 2),'application/json' as any);
        allure.createAttachment('prevAssetTotalSupply', JSON.stringify(prevAssetTotalSupply, null, 2),'application/json' as any);
        allure.createAttachment('assetsPaymentValuesNormalized', JSON.stringify(assetsPaymentValuesNormalized, null, 2),'application/json' as any);
        allure.createAttachment('masValuesPayment', JSON.stringify(masValuesPayment, null, 2),'application/json' as any);
        allure.createAttachment('masRequirementAmounts', JSON.stringify(masRequirementAmounts, null, 2),'application/json' as any);
        allure.createAttachment('masChange', JSON.stringify(masChange, null, 2),'application/json' as any);
        allure.createAttachment('assetBalances', JSON.stringify(assetBalances, null, 2),'application/json' as any);
        allure.createAttachment('assetBalances', JSON.stringify(assetBalances, null, 2),'application/json' as any);
        allure.createAttachment('assetTotalSupply', JSON.stringify(assetTotalSupply, null, 2),'application/json' as any);
        allure.createAttachment('lpTokensToMint', JSON.stringify(lpTokensToMint, null, 2),'application/json' as any);
        allure.createAttachment('invariant', JSON.stringify(invariant, null, 2),'application/json' as any);
        outConsoleOrAllure('calculateDepositAll finished...')
        return [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,Number(storage['lpTotalSupply'])]
    }

    async calculateDeposit(masAssetsPayment:Asset[],masValuesPayment:number[],depositAmount:number):Promise<[number,number[],number,number[],number]> {
        outConsoleOrAllure('calculateDeposit started...')
        const [assetWeights, sigmaWeight] = await this.getAssetWeightsAndSigma( this.paramContract.KEY_ASSET_WEIGHTS);
        outConsoleOrAllure('assetWeights', assetWeights);
        outConsoleOrAllure('sigmaWeight', sigmaWeight);
        const [prevAssetBalances, prevAssetTotalSupply] = await this.loadAssetBalances()
        outConsoleOrAllure('prevAssetBalances: ',prevAssetBalances);
        outConsoleOrAllure('prevAssetTotalSupply: ',prevAssetTotalSupply);
        const assetsPaymentValuesNormalized = await this.getAssetsPaymentNormalized(masAssetsPayment,masValuesPayment)
        outConsoleOrAllure('assetsPaymentValuesNormalized: ',assetsPaymentValuesNormalized)
        outConsoleOrAllure('masValuesPayment: ',masValuesPayment)
        const index = await this.getIndex(masAssetsPayment)
        const [assetBalances, assetTotalSupply] = this.incrementBalanceByIndex(prevAssetBalances,index,assetsPaymentValuesNormalized[0])
        outConsoleOrAllure('assetBalances: ',assetBalances)
        outConsoleOrAllure('assetTotalSupply: ',assetTotalSupply)
        const storage = await this.getSTORAGE()
        const maxAllocAmp = storage.maxAllocationAmplifier
        const lpTotalSupply = storage.lpTotalSupply
        const validateAllocation = this.validateAllocation(assetBalances,assetTotalSupply,prevAssetBalances,prevAssetTotalSupply,assetWeights,sigmaWeight,maxAllocAmp)
        outConsoleOrAllure('validateAllocation: ',validateAllocation)
        outConsoleOrAllure('Calculate prevFee........')
        const prevFee = this.calculateFee(
            prevAssetBalances,
            prevAssetTotalSupply,
            assetWeights,
            sigmaWeight,
            Number(storage['weightAmplifier']),
            Number(storage['slippageRate']),
            Number(storage['feeMaxRate']))
        outConsoleOrAllure('prevFee: ',prevFee)
        outConsoleOrAllure('Calculate fee........')
        const fee = this.calculateFee(
            assetBalances,
            assetTotalSupply,
            assetWeights,
            sigmaWeight,
            Number(storage['weightAmplifier']),
            Number(storage['slippageRate']),
            Number(storage['feeMaxRate']))
        outConsoleOrAllure('fee: ',fee)
        let lpTokensToMint = 0;
        if (lpTotalSupply == 0) {
            lpTokensToMint = assetTotalSupply - fee
            outConsoleOrAllure('lpTokensToMint when lpTotalSupply == 0 : ',lpTokensToMint)
        } else {
            const assetDiff = assetTotalSupply - prevAssetTotalSupply
            outConsoleOrAllure('assetDiff= assetTotalSupply - prevAssetTotalSupply: ',assetDiff)
            const feeDiff = fee - prevFee
            outConsoleOrAllure('feeDiff=fee - prevFee: ',feeDiff)
            const utilityChangeFactor = Math.floor((assetDiff- feeDiff) * this.paramContract.RATE_FACTOR/(prevAssetTotalSupply - prevFee)) //TODO QA: can it be (assetDiff - feeDiff) < 0 ????
            outConsoleOrAllure('utilityChangeFactor=(assetDiff- feeDiff) * this.paramContract.RATE_FACTOR/(prevAssetTotalSupply - prevFee) :',utilityChangeFactor)
            const lpTokenToMintInner = Math.floor(lpTotalSupply* utilityChangeFactor/this.paramContract.RATE_FACTOR)
            outConsoleOrAllure('lpTokenToMintInner: ',lpTokenToMintInner)
            const invariant = this.validateLiquidityInvariant(
                prevAssetBalances,
                prevAssetTotalSupply,
                assetBalances,
                assetTotalSupply,
                lpTotalSupply,
                lpTotalSupply + lpTokenToMintInner,
                assetWeights,
                sigmaWeight,
                Number(storage['weightAmplifier']),
                Number(storage['slippageRate']),
                Number(storage['feeMaxRate']))
            outConsoleOrAllure('invariant: ',invariant)
            lpTokensToMint =  lpTokenToMintInner
            outConsoleOrAllure('lpTokensToMint: ',lpTokensToMint)
            allure.createAttachment('assetDiff', JSON.stringify(assetDiff, null, 2),'application/json' as any);
            allure.createAttachment('feeDiff', JSON.stringify(feeDiff, null, 2),'application/json' as any);
            allure.createAttachment('utilityChangeFactor', JSON.stringify(utilityChangeFactor, null, 2),'application/json' as any);
            allure.createAttachment('lpTokenToMintInner', JSON.stringify(lpTokenToMintInner, null, 2),'application/json' as any);
            allure.createAttachment('invariant', JSON.stringify(invariant, null, 2),'application/json' as any);
        }
        (lpTokensToMint < depositAmount) ? outConsoleOrAllure('ERROR!!! lpTokensToMint < depositAmount, depositSelective: less than min lp') : null
        const masChange = this.getChange(masValuesPayment,[depositAmount])
        outConsoleOrAllure('masChange: ',masChange)
        outConsoleOrAllure('calculateDepositAll finished...');
        outConsoleOrAllure('calculateDeposit finished...')
        return [lpTokensToMint,assetBalances,prevAssetTotalSupply,masChange,Number(storage['lpTotalSupply'])]
    }
    async calculateWithdrawAll(masAssetsPayment:Asset[],masValuesPayment:number[]):Promise<[number[],number[],number,number]> {
        outConsoleOrAllure('calculateWithdrawAll started...')
        outConsoleOrAllure('masAssetsPayment: ',masAssetsPayment);
        outConsoleOrAllure('masValuesPayment: ',masValuesPayment);
        const storage = await this.getSTORAGE()
        const lpTotalSupply = storage.lpTotalSupply
        const [assetWeights, sigmaWeight] = await this.getAssetWeightsAndSigma( this.paramContract.KEY_ASSET_WEIGHTS);
        outConsoleOrAllure('assetWeights', assetWeights);
        outConsoleOrAllure('sigmaWeight', sigmaWeight);
        const [prevAssetBalances, prevAssetTotalSupply] = await this.loadAssetBalances()
        outConsoleOrAllure('prevAssetBalances: ',prevAssetBalances);
        outConsoleOrAllure('prevAssetTotalSupply: ',prevAssetTotalSupply);
        const [lpFee,protocolFee,sigmaFeePerLpUpdated] = await this.calculateLpAndProtocolFees(0,masValuesPayment[0],true)
        outConsoleOrAllure('lpFee: ',lpFee)
        outConsoleOrAllure('protocolFee: ',protocolFee)
        outConsoleOrAllure('sigmaFeePerLpUpdated: ',sigmaFeePerLpUpdated)
        const lpTokensToBurn = masValuesPayment[0] - lpFee - protocolFee
        outConsoleOrAllure('lpTokensToBurn: ',lpTokensToBurn)
        const [assetBalances, assetTotalSupply,balancesToPay] = this.decrementBalancesByLpAmount(prevAssetBalances,lpTokensToBurn,storage.lpTotalSupply)
        outConsoleOrAllure('assetBalances: ',assetBalances)
        outConsoleOrAllure('assetTotalSupply: ',assetTotalSupply)
        outConsoleOrAllure('balancesToPay: ',balancesToPay)
        const lpTotalSupplyUpdated = lpTotalSupply - lpTokensToBurn
        outConsoleOrAllure('lpTotalSupplyUpdated: ',lpTotalSupplyUpdated)
        const assets = await this.getAssets()
        const paymentActions = await this.getPaymentsFromBalances(assets,balancesToPay,await this.getLpDecimals())
        outConsoleOrAllure('paymentActions: ',paymentActions)
        const invariant = this.validateLiquidityInvariant(
            prevAssetBalances,
            prevAssetTotalSupply,
            assetBalances,
            assetTotalSupply,
            lpTotalSupply,
            lpTotalSupplyUpdated,
            assetWeights,
            sigmaWeight,
            Number(storage['weightAmplifier']),
            Number(storage['slippageRate']),
            Number(storage['feeMaxRate']))
        outConsoleOrAllure('invariant: ',invariant)
        outConsoleOrAllure('calculateWithdrawAll finished...')
        return [assetBalances, paymentActions, lpTotalSupplyUpdated,lpTokensToBurn]
    }

    async calculateWithdraw(assetPayment:Asset,withdrawAmount:number,paymentAmount:number) {
        outConsoleOrAllure('calculateWithdraw started...')
        const assets = await this.getAssets()
        outConsoleOrAllure('assets in the pull: ',assets);
        outConsoleOrAllure('assetPayment: ',assetPayment);
        outConsoleOrAllure('withdrawAmount: ',withdrawAmount);
        const storage = await this.getSTORAGE()
        const lpTotalSupply = storage.lpTotalSupply
        const lpTotalSupplyBefore = storage.lpTotalSupply
        const [assetWeights, sigmaWeight] = await this.getAssetWeightsAndSigma( this.paramContract.KEY_ASSET_WEIGHTS);
        outConsoleOrAllure('assetWeights', assetWeights);
        outConsoleOrAllure('sigmaWeight', sigmaWeight);
        const [prevAssetBalances, prevAssetTotalSupply] = await this.loadAssetBalances()
        outConsoleOrAllure('prevAssetBalances: ',prevAssetBalances);
        outConsoleOrAllure('prevAssetTotalSupply: ',prevAssetTotalSupply);
        const assetDecimal = await this.getAssetDecimals(assetPayment.assetId)
        outConsoleOrAllure('assetDecimal: ',assetDecimal);
        const amountNormalized = this.getNormalized(withdrawAmount,assetDecimal,await this.getLpDecimals(),"DOWN")
        outConsoleOrAllure('amountNormalized: ',amountNormalized);
        const index = assets.indexOf(assetPayment.assetId)
        outConsoleOrAllure('index: ',index);
        let [assetBalances, assetTotalSupply] = this.decrementBalanceByIndex(prevAssetBalances,index,amountNormalized)
        assetTotalSupply = prevAssetTotalSupply-amountNormalized
        const prevFee = this.calculateFee(
            prevAssetBalances,
            prevAssetTotalSupply,
            assetWeights,
            sigmaWeight,
            Number(storage['weightAmplifier']),
            Number(storage['slippageRate']),
            Number(storage['feeMaxRate']))
        outConsoleOrAllure('prevFee: ',prevFee)
        outConsoleOrAllure('Calculate fee........')
        const fee = this.calculateFee(
            assetBalances,
            assetTotalSupply,
            assetWeights,
            sigmaWeight,
            Number(storage['weightAmplifier']),
            Number(storage['slippageRate']),
            Number(storage['feeMaxRate']))
        outConsoleOrAllure('fee: ',fee)
        let lpTokensToBurn=0;
        if(lpTotalSupply == 0) {
            lpTokensToBurn = assetTotalSupply-fee
        } else {
            const assetDiff = assetTotalSupply - prevAssetTotalSupply
            outConsoleOrAllure('assetDiff= assetTotalSupply - prevAssetTotalSupply: ',assetDiff)
            const feeDiff = fee - prevFee
            outConsoleOrAllure('feeDiff=fee - prevFee: ',feeDiff)
            outConsoleOrAllure('assetDiff- feeDiff: ',assetDiff- feeDiff)
            const utilityChangeFactor = Math.floor((assetDiff- feeDiff) * this.paramContract.RATE_FACTOR/(prevAssetTotalSupply - prevFee)) //TODO QA: can it be (assetDiff - feeDiff) < 0 ????
            outConsoleOrAllure('utilityChangeFactor=(assetDiff- feeDiff) * this.paramContract.RATE_FACTOR/(prevAssetTotalSupply - prevFee) :',utilityChangeFactor)
            const lpTokensToBurnInner = -1 * Math.floor(lpTotalSupply* utilityChangeFactor/this.paramContract.RATE_FACTOR)
            outConsoleOrAllure('lpTokensToBurnInner: ',lpTokensToBurnInner)
            lpTokensToBurn = lpTokensToBurnInner;
            const invariant = this.validateLiquidityInvariant(
                prevAssetBalances,
                prevAssetTotalSupply,
                assetBalances,
                assetTotalSupply,
                lpTotalSupply,
                lpTotalSupply - lpTokensToBurnInner,
                assetWeights,
                sigmaWeight,
                Number(storage['weightAmplifier']),
                Number(storage['slippageRate']),
                Number(storage['feeMaxRate']))
                allure.createAttachment('assetDiff', JSON.stringify(assetDiff, null, 2),'application/json' as any);
                allure.createAttachment('feeDiff', JSON.stringify(feeDiff, null, 2),'application/json' as any);
                allure.createAttachment('utilityChangeFactor', JSON.stringify(utilityChangeFactor, null, 2),'application/json' as any);
                allure.createAttachment('lpTokensToBurnInner', JSON.stringify(lpTokensToBurnInner, null, 2),'application/json' as any);
                allure.createAttachment('invariant', JSON.stringify(invariant, null, 2),'application/json' as any);
                outConsoleOrAllure('invariant: ',invariant)
        }
        const [lpFee,protocolFee,sigmaFeePerLpUpdated] = await this.calculateLpAndProtocolFees(0,withdrawAmount,false)
        outConsoleOrAllure('lpFee: ',lpFee)
        outConsoleOrAllure('protocolFee: ',protocolFee)
        const requiredLpTokens = lpTokensToBurn+ lpFee + protocolFee
        outConsoleOrAllure('requiredLpTokens: ',requiredLpTokens);
        outConsoleOrAllure('sigmaFeePerLpUpdated: ',sigmaFeePerLpUpdated)
        const changeAction = this.getChange([paymentAmount],[requiredLpTokens])
        outConsoleOrAllure('changeAction: ',changeAction)
        outConsoleOrAllure('calculateWithdraw finished...')
        return [assetBalances, lpTokensToBurn, lpFee, protocolFee, requiredLpTokens,lpTotalSupplyBefore,changeAction]
    }

    async calculateStake(user: Account,paymentAmount:number):Promise<[number, number]> {
        outConsoleOrAllure('calculateStake started...')
        const assetIds = await this.getAssets()
        outConsoleOrAllure('assetIds in the pull: ',assetIds);
        const storage = await this.getSTORAGE()
        const lpTotalSupply = storage.lpTotalSupply
        const lpTotalSupplyBefore = storage.lpTotalSupply
        outConsoleOrAllure('lpTotalSupplyBefore: ',lpTotalSupplyBefore)
        const stakedBalance = await this.loadUserLp(user)
        outConsoleOrAllure('stakedBalance: ',stakedBalance)
        const totalLp = await this.loadTotalLp()
        const stakedBalanceSum = stakedBalance+paymentAmount
        outConsoleOrAllure('stakedBalanceSum: ',stakedBalanceSum)
        const totalLpSum = totalLp+paymentAmount
        outConsoleOrAllure('totalLpSum: ',totalLpSum)
        outConsoleOrAllure('calculateStake finished...')
        return [stakedBalanceSum,totalLpSum ]
    }
    async runCommandToSwapAndGetState(commands:any[]) {
        let resultForTable:any[] = []
        let transaction;
        let lpToken;
        for (let [index,command] of commands.entries()) {
            outConsoleOrAllure('command.name: ',command.name)
            const balanceBeforeCommand = await this.getState([this.paramContract.KEY_ASSET_BALANCES])
            switch (command.name) {
                case 'init': {
                    transaction =  await init(
                        convertList2MapList(command.assets.map((x: { assetId: any; }) => {return x.assetId})),
                        convertList2MapList(command.assetWeights.map(String)),
                        command.lpFeeRate,
                        command.protocolFeeRate,
                        command.lpTokenName,
                        command.lpTokenDescr,
                        command.lpTokenDecimals,
                        command.maxAllocationAmplifier,
                        command.weightAmplifier,
                        command.slippageRate,
                        command.feeMaxRate,
                        command.protocolFeeContract,
                        command.user,
                        this.contract
                    );
                    const state = await this.getState([this.paramContract.KEY_STORAGE, this.paramContract.KEY_ASSETS,
                        this.paramContract.KEY_ASSET_WEIGHTS,this.paramContract.KEY_ASSET_BALANCES])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state})
                    const storage = await this.getSTORAGE()
                    const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                    lpToken = {
                        name: lpTokenInfo.name,
                        description: lpTokenInfo.description,
                        quantity: lpTokenInfo.quantity as number,
                        decimals: lpTokenInfo.decimals,
                        assetId: lpTokenInfo.assetId
                    }
                    outConsoleOrAllure('lpToken inside init: ',lpToken)
                    break;
                }
                case 'depositAll': {
                    transaction =  await depositAll(
                        command.depositAmount,
                        convertToMasPayments(command.masAssetsPayment, command.masValuesPayment),
                        command.user,
                        this.contract
                    );
                    const state = await this.getState([this.paramContract.KEY_ASSET_BALANCES])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state})
                    break;
                }
                case 'deposit':{
                    transaction = await deposit(
                        command.depositAmount,
                        convertToMasPayments(command.masAssetsPayment, command.masValuesPayment),
                        command.user,
                        this.contract
                    );
                    const state = await this.getState([this.paramContract.KEY_ASSET_BALANCES])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state})
                    break;
                }
                case 'withdrawAll':{
                    if(command.masAssetsPayment[0] === undefined) {
                        const storage = await this.getSTORAGE()
                        const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                        lpToken = {
                            name: lpTokenInfo.name,
                            description: lpTokenInfo.description,
                            quantity: lpTokenInfo.quantity as number,
                            decimals: lpTokenInfo.decimals,
                            assetId: lpTokenInfo.assetId
                        }
                        command.masAssetsPayment = [lpToken]
                    }
                    transaction = await withdrawAll(
                        convertToMasPayments(command.masAssetsPayment, command.masValuesPayment),
                        command.user,
                        this.contract
                    );
                    const state = await this.getState([this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_LP_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_PROTOCOL_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.user.address,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});
                    break;
                }
                case 'withdraw':{
                    if(command.masAssetsPayment[0] === undefined) {
                        const storage = await this.getSTORAGE()
                        const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                        lpToken = {
                            name: lpTokenInfo.name,
                            description: lpTokenInfo.description,
                            quantity: lpTokenInfo.quantity as number,
                            decimals: lpTokenInfo.decimals,
                            assetId: lpTokenInfo.assetId
                        }
                        command.masAssetsPayment = [lpToken]
                    }
                    transaction = await withdraw(
                        command.assetId,
                        command.withdrawAmount,
                        convertToMasPayments(command.masAssetsPayment, command.masValuesPayment),
                        command.user,
                        this.contract
                    );
                    const state = await this.getState([this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_LP_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_PROTOCOL_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.user.address,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});
                    break;
                }
                //min a2-> get a3
                case 'swap':{
                    transaction = await swap(
                        command.targetAssetId,
                        command.minAmount,
                        convertToMasPayments(command.masAssetsPayment, command.masValuesPayment),
                        command.user,
                        this.contract
                    )
                    const state = await this.getState([this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_TOTAL_LP,
                        this.paramContract.KEY_USER_LP+'__'+command.user.address,
                        this.paramContract.KEY_USER_PROFITS+'__'+command.user.address,
                        this.paramContract.KEY_LP_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_PROTOCOL_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.user.address,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});
                    break;
                }
                case 'stake':{
                    if(command.masAssetsPayment[0] ===  undefined) {
                        const storage = await this.getSTORAGE()
                        const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                        lpToken = {
                            name: lpTokenInfo.name,
                            description: lpTokenInfo.description,
                            quantity: lpTokenInfo.quantity as number,
                            decimals: lpTokenInfo.decimals,
                            assetId: lpTokenInfo.assetId
                        }
                        command.masAssetsPayment = [lpToken]
                    }
                    transaction = await stake(
                        convertToMasPayments(command.masAssetsPayment, command.masValuesPayment),
                        command.user,
                        this.contract
                    )
                    if (transaction === undefined) {
                        outConsoleOrAllure('ERROR!!! transaction is undefined')
                    }
                    const state = await this.getState([
                        this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_TOTAL_LP,
                        this.paramContract.KEY_USER_LP+'__'+command.user.address,
                        this.paramContract.KEY_USER_PROFITS+'__'+command.user.address,
                        this.paramContract.KEY_LP_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_PROTOCOL_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.user.address,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});//JSON.stringify(state,null,4)
                    break;
                }
                case 'unstake':{
                    transaction = await unstake(
                        command.unstakeAmount,
                        command.user,
                        this.contract
                    )
                    const state = await this.getState([
                        this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_TOTAL_LP,
                        this.paramContract.KEY_USER_LP+'__'+command.user.address,
                        this.paramContract.KEY_USER_PROFITS+'__'+command.user.address,
                        // this.paramContract.KEY_LP_FEE+'__'+command.masAssetsPayment[0].assetId,
                        // this.paramContract.KEY_PROTOCOL_FEE+'__'+command.masAssetsPayment[0].assetId,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.user.address,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});
                    break;
                }
                case 'claim':{
                    if(command.assets[0] === undefined) {
                        outConsoleOrAllure('command.assetId === undefined!!!!!!!!!!!')
                        const storage = await this.getSTORAGE()
                        const lpTokenInfo = await getAssetInfo(storage.lpAssetId);
                        lpToken = {
                            name: lpTokenInfo.name,
                            description: lpTokenInfo.description,
                            quantity: lpTokenInfo.quantity as number,
                            decimals: lpTokenInfo.decimals,
                            assetId: lpTokenInfo.assetId
                        }
                        command.assets = [lpToken.assetId]
                    }
                    console.log('command.assets: ',command.assets)
                    transaction = await claim(
                        command.userForClaim,
                        convertList2MapList(command.assets),
                        command.user,
                        this.contract
                    )
                    const state = await this.getState([
                        this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_TOTAL_LP,
                        this.paramContract.KEY_USER_LP+'__'+command.user.address,
                        this.paramContract.KEY_USER_PROFITS+'__'+command.user.address,
                        this.paramContract.KEY_LP_FEE+'__'+command.assetId,
                        this.paramContract.KEY_PROTOCOL_FEE+'__'+command.assetId,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.user.address,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});
                    break;
                }
                case 'checkpoint': {
                    transaction = await checkpoint(
                        command.userAddressForCheckpoint,
                        command.user,
                        this.contract
                    )
                    const state = await this.getState([
                        this.paramContract.KEY_ASSET_BALANCES,
                        this.paramContract.KEY_TOTAL_LP,
                        this.paramContract.KEY_USER_LP+'__'+command.userAddressForCheckpoint,
                        this.paramContract.KEY_USER_PROFITS+'__'+command.userAddressForCheckpoint,
                        this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+'__'+command.userAddressForCheckpoint,
                        this.paramContract.KEY_SIGMA_FEE_PER_LP])
                    resultForTable.push({command:command.name,balanceBeforeCommand, state:state});
                    break;
                }
            }
        }
        const height = getHeightFromTransaction(transaction)
        console.table(resultForTable)
        return {resultForTable,height}
    }

    async getState(keys:any[]) {
        let resultArray = new Array()
        let resultSet = new Map()
        for(const key of keys) {
            const res = await getDataValue(this.contract, key, this.network)
            resultSet.set(key,res)
            resultArray.push(resultSet)
        }
        return resultSet
    }

    async calculateUnstake(user: Account,amount:number) {
        const assets = await this.getAssets()
        outConsoleOrAllure('assets in the pull: ',assets);
        const storage = await this.getSTORAGE()
        const lpAssetId = storage.lpAssetId
        const lpTotalSupplyBefore = storage.lpTotalSupply
        outConsoleOrAllure('lpTotalSupplyBefore: ',lpTotalSupplyBefore)
        const stakedBalance = await this.loadUserLp(user)
        outConsoleOrAllure('stakedBalance: ',stakedBalance)
        const userProfits= await this.userCheckpoint(user)
        outConsoleOrAllure('userProfits: ',userProfits)
        const totalLp = await this.loadTotalLp()
        const stakedBalanceSum = stakedBalance-amount
        outConsoleOrAllure('stakedBalanceSum: ',stakedBalanceSum)
        const totalLpSum = totalLp-amount
        outConsoleOrAllure('totalLpSum: ',totalLpSum)
        return [stakedBalanceSum,totalLpSum ]
    }
    async getStateForStaking(users:Account[],assets:Asset[]) {
        const SIGMA_FEE_PER_LP  = await getDataValue(this.contract, `SIGMA_FEE_PER_LP`, this.network)
        const ASSET_BALANCES  = await getDataValue(this.contract, 'ASSET_BALANCES', this.network)
        const TOTAL_LP:unknown  = await getDataValue(this.contract, 'TOTAL_LP', this.network)
        let USER_LP=[]
        let USER_PROFITS=[]
        let USER_SIGMA_FEE_PER_LP=[]
        for(const user of users) {
            const user_lp  = await getDataValue(this.contract, `USER_LP__${user.address}`, this.network)
            const user_profits  = await getDataValue(this.contract, `USER_PROFITS__${user.address}`, this.network)
            const user_sigma_fee_per_lp  = await getDataValue(this.contract, `USER_SIGMA_FEE_PER_LP__${user.address}`, this.network)
            USER_LP.push(user_lp)
            USER_PROFITS.push(user_profits)
            USER_SIGMA_FEE_PER_LP.push(user_sigma_fee_per_lp)
        }
        let LP_FEE = []
        let PROTOCOL_FEE = []
        for(const asset of assets) {
            const lp_fee_asset = await getDataValue(this.contract, `LP_FEE__${asset.assetId}`, this.network)
            const protocol_fee_asset = await getDataValue(this.contract, `PROTOCOL_FEE__${asset.assetId}`, this.network)
            LP_FEE.push(lp_fee_asset)
            PROTOCOL_FEE.push(protocol_fee_asset)
        }
        return {TOTAL_LP,USER_LP,USER_PROFITS,ASSET_BALANCES,USER_SIGMA_FEE_PER_LP,SIGMA_FEE_PER_LP,LP_FEE,PROTOCOL_FEE}
    }

    async calculateCheckpoint(user:Account){
        outConsoleOrAllure('Calculate checkpoint...')
        const userLP = await this.loadUserLp(user)
        outConsoleOrAllure('userLP: ',userLP)
        const userProfits = (await getDataValue(this.contract, `USER_PROFITS__${user.address}`, this.network) as string ?? this.paramContract.defaultZERO11).split('__').map(Number)
        const sigmaFeePerLp = (await getDataValue(this.contract, `SIGMA_FEE_PER_LP`, this.network) as string ?? this.paramContract.defaultZERO11).split('__').map(BigInt)
        const userSigmaFeePerLp = (await getDataValue(this.contract, `USER_SIGMA_FEE_PER_LP__${user.address}`, this.network) as string ?? this.paramContract.defaultZERO11).split('__').map(BigInt)
        let profitUpdated =[]
        for(let i=0;i<11;i++) {
            profitUpdated[i] = userProfits[i] + Math.floor(Number(BigInt(userLP) * (sigmaFeePerLp[i] - userSigmaFeePerLp[i]) / this.paramContract.PERCENT_FACTOR))
        }
        return [profitUpdated.join('__'),userSigmaFeePerLp.join('__')]
    }

    async userCheckpoint(user:Account){
        outConsoleOrAllure('Calculate userCheckpoint...')
        const userProfit = await this.loadProfits(user)
        outConsoleOrAllure('userProfit: ',userProfit)
        const userLp = await this.loadUserLp(user)
        outConsoleOrAllure('userLp: ',userLp)
        const sigmaFeePerLp = await this.loadSigmaFeePerLp()
        outConsoleOrAllure('sigmaFeePerLp: ',sigmaFeePerLp)
        const userSigmaFeePerLp = await this.loadUserSigmaFeePerLp(user)
        outConsoleOrAllure('userSigmaFeePerLp: ',userSigmaFeePerLp)
        let profitUpdated:number[] = []
        for(let i=0; i<userProfit.length;i++) {
            const bigIntValue = BigInt(userLp)*BigInt(sigmaFeePerLp[i]-userSigmaFeePerLp[i])/this.paramContract.PERCENT_FACTOR
            const profit = userProfit[i] + Number(bigIntValue)
            profitUpdated.push(profit)
        }
        return profitUpdated

    }
    async calculateLpAndProtocolFees(index:number,amount:number,isFullAmount:boolean):Promise<[number,number,bigint[]]> {
        const sigmaFeePerLp = await this.loadSigmaFeePerLp()
        const totalLp = await this.loadTotalLp()
        const storage = await this.getSTORAGE()
        let lpFee = 0;
        let protocolFee = 0;
        if (isFullAmount == true) {
            if (totalLp == 0) {
                lpFee = 0;
                protocolFee= Math.floor(amount*storage.protocolFeeRate/this.paramContract.MAX_FEE)
            } else {
                lpFee= Math.floor(amount*storage.lpFeeRate/this.paramContract.MAX_FEE)
            }
        } else {
            if (totalLp == 0) {
                lpFee = 0;
                protocolFee= Math.floor(amount*storage.protocolFeeRate/(this.paramContract.MAX_FEE-storage.protocolFeeRate))
            } else {
                lpFee= Math.floor(amount*storage.lpFeeRate/(this.paramContract.MAX_FEE-storage.lpFeeRate-storage.protocolFeeRate))
                protocolFee= Math.floor(amount*storage.protocolFeeRate/(this.paramContract.MAX_FEE-storage.lpFeeRate-storage.protocolFeeRate))
            }
        }
        let sigmaFeePerLpUpdated:bigint[] = []
        if(totalLp==0){
            sigmaFeePerLpUpdated=sigmaFeePerLp
        } else {
            sigmaFeePerLpUpdated = await this.updateSigmaFeePerLp(index,lpFee)
        }
        return [lpFee,protocolFee,sigmaFeePerLpUpdated]
    }
    async updateSigmaFeePerLp(index:number,lpFee:number) {
        const sigmaFeePerLp = await this.loadSigmaFeePerLp()
        const totalLp = await this.loadTotalLp()
        let sigmaFeePerLpUpdated:bigint[] = []
        for(let i=0;i<sigmaFeePerLp.length;i++) {
            if (i===index) {
                sigmaFeePerLpUpdated[i] = sigmaFeePerLp[i] + BigInt(lpFee)*this.paramContract.PERCENT_FACTOR/BigInt(totalLp)
            }else {
                sigmaFeePerLpUpdated[i] = sigmaFeePerLp[i]
            }
        }
        return sigmaFeePerLpUpdated
    }
    async loadSigmaFeePerLp() {
        const sigmaFeePerLpRaw = await getDataValue(this.contract, this.paramContract.KEY_SIGMA_FEE_PER_LP, this.network) as string ?? '0__0__0__0__0__0__0__0__0__0__0'
        outConsoleOrAllure('sigmaFeePerLpRaw: ',sigmaFeePerLpRaw)
        outConsoleOrAllure('sigmaFeePerLpRaw ?? this.paramContract.defaultZERO11: ',sigmaFeePerLpRaw ?? this.paramContract.defaultZERO11)
        const sigmaFeePerLp = (sigmaFeePerLpRaw ?? this.paramContract.defaultZERO11).split(this.paramContract.SEP).map(BigInt) //as unknown as bigint[]
        return sigmaFeePerLp
    }
    async loadUserSigmaFeePerLp(user:Account) {
        const userSigmaFeePerLpRaw = await getDataValue(this.contract, this.paramContract.KEY_USER_SIGMA_FEE_PER_LP+this.paramContract.SEP+user.address, this.network) as string ?? '0__0__0__0__0__0__0__0__0__0__0'
        const userSigmaFeePerLp = (userSigmaFeePerLpRaw ?? this.paramContract.defaultZERO11).split(this.paramContract.SEP).map(BigInt) //as unknown as bigint[]
        return userSigmaFeePerLp
    }

    async loadLpFee(assetId:string){
        const plFee = await getDataValue(this.contract, this.paramContract.KEY_LP_FEE+this.paramContract.SEP+assetId, this.network) as number ?? 0
        return plFee
    }

    async loadUserLp(user:Account) {
        const userLpBalance:number = await getDataValue(this.contract, this.paramContract.KEY_USER_LP+this.paramContract.SEP+user.address, this.network) as number ?? 0
        return userLpBalance
    }

    async loadProfits(user:Account){
        const userProfitsRaw = await getDataValue(this.contract, this.paramContract.KEY_USER_PROFITS+this.paramContract.SEP+user.address, this.network) as string ?? '0__0__0__0__0__0__0__0__0__0__0'
        outConsoleOrAllure('userProfitsRaw: ',userProfitsRaw)
        const userProfits = userProfitsRaw.split(this.paramContract.SEP).map(Number)// as unknown as number[]
        return userProfits
    }

    async loadTotalLp() {
        const totalLp:number = await getDataValue(this.contract, this.paramContract.KEY_TOTAL_LP, this.network) as number ?? 0
        return totalLp
    }
    async getHeight():Promise<number> {
        const height = await nodeInteraction.currentHeight(this.network.nodeAPI) as number
        return height
    }

    async getPaymentsFromBalances(assets:string[],deltaAssetBalances:number[],lpDecimals:number) {
        let paymentActions:number[] = []
        for(let i=0;i<assets.length;i++) {
            const assetDecimal = await this.getAssetDecimals(assets[i])
            const balanceNormalized =  this.getNormalized(deltaAssetBalances[i],lpDecimals,assetDecimal,"DOWN")
            outConsoleOrAllure('balanceNormalized: ',balanceNormalized)
            paymentActions.push(balanceNormalized)
        }
        return paymentActions
    }

    decrementBalancesByLpAmount(prevAssetBalances:number[],amount:number,lpTotalSupply:number):[number[],number,number[]] {
        const rate = Math.ceil((lpTotalSupply-amount)*this.paramContract.RATE_FACTOR/lpTotalSupply)//TODO check round up ???
        outConsoleOrAllure('rate: ',rate)
        const assetBalances = []
        let assetTotalSupply = 0
        const deltaAssetBalances = []
        for(let i=0;i<prevAssetBalances.length;i++) {
            const newBalance = Math.ceil(prevAssetBalances[i]*rate/this.paramContract.RATE_FACTOR)
            const deltaBalance = prevAssetBalances[i] - newBalance
            assetBalances.push(newBalance)
            deltaAssetBalances.push(deltaBalance)
        }
        assetTotalSupply = assetBalances.reduce((acc,cur) => acc + cur,0)
        return [assetBalances, assetTotalSupply, deltaAssetBalances]
    }
    async getIndex(masAssetsPayment:Asset[]) {
        const assetsRaw =  await getDataValue(this.contract, this.paramContract.KEY_ASSETS, this.network) as string
        const items = assetsRaw.split(this.paramContract.SEP)
        return items.indexOf(masAssetsPayment[0].assetId)
    }

    validateAllocation(assetBalances: number[],assetTotalSupply:number,prevAssetBalances:number[],prevAssetTotalSupply:number,assetWeights:number[],sigmaWeight:number,maxAllocAmp:number) {
        let resultAll = true
        for(let i=0;i< assetBalances.length; i++) {
            const result = this.validateAssetAllocation(assetBalances[i],assetTotalSupply,prevAssetBalances[i],prevAssetTotalSupply,assetWeights[i],sigmaWeight,maxAllocAmp) ?? false
            outConsoleOrAllure(`validateAssetAllocation for asset with index "${i}":`,result)
            resultAll = resultAll && result
        }
        return resultAll

    }
    validateAssetAllocation(assetBalance:number,assetTotalSupply:number,prevAssetBalance:number,prevAssetTotalSupply:number,assetWeight:number,sigmaWeight:number,maxAllocAmp:number){
        let equilibrium = Math.floor(assetTotalSupply* assetWeight/ sigmaWeight)
        outConsoleOrAllure('equilibrium: ',equilibrium)
        let maxAllocationAmp = (assetBalance > equilibrium) ? this.paramContract.MAX_AMPLIFIER + maxAllocAmp : this.paramContract.MAX_AMPLIFIER - maxAllocAmp
        outConsoleOrAllure('maxAllocationAmp: ',maxAllocationAmp)
        let maxAllocation = Math.floor(equilibrium * maxAllocationAmp/ this.paramContract.MAX_AMPLIFIER)
        outConsoleOrAllure('maxAllocation: ',maxAllocation)
        let prevMaxAllocation = Math.floor((prevAssetTotalSupply* assetWeight/ sigmaWeight)* maxAllocationAmp/ this.paramContract.MAX_AMPLIFIER)
        outConsoleOrAllure('prevMaxAllocation: ',prevMaxAllocation)
        if (assetBalance > equilibrium) {
            outConsoleOrAllure('assetBalance > equilibrium')
            if (assetBalance > maxAllocation) {
                outConsoleOrAllure('assetBalance > maxAllocation')
                if (prevAssetBalance < prevMaxAllocation) {
                    outConsoleOrAllure('Exception!!! _validateAssetAllocation: new up')
                } else if (assetBalance - maxAllocation > prevAssetBalance - prevMaxAllocation) {
                    outConsoleOrAllure('Exception!!!_validateAssetAllocation: still up')
                } else {
                    return true
                }
            } else {
                return true
            }
        } else {
            outConsoleOrAllure('assetBalance < equilibrium')
            if (assetBalance < maxAllocation) {
                outConsoleOrAllure('assetBalance < maxAllocation')
                if (prevAssetBalance > prevMaxAllocation) {
                    outConsoleOrAllure('Exception!!! _validateAssetAllocation: new down')
                } else if (maxAllocation - assetBalance < prevMaxAllocation - prevAssetBalance) {
                        outConsoleOrAllure('Exception!!! _validateAssetAllocation: still down')
                    } else {
                        return true
                    }
            } else {
                return true
            }
        }
    }

    incrementBalanceByIndex(prevAssetBalances:number[],index:number,depositAmount:number):[number[],number] {
        const assetBalances:number[] = [];
        let assetTotalSupply=0;
        for(let i=0;i<prevAssetBalances.length;i++) {
            assetBalances[i] = prevAssetBalances[i] + (i===index ? depositAmount : 0)
        }
        assetTotalSupply = assetBalances.reduce((acc,cur) => acc + cur,0)
        return [assetBalances, assetTotalSupply]
    }

    decrementBalanceByIndex(prevAssetBalances:number[],index:number,amountPayment:number):[number[],number]{
        const assetBalances:number[] = [];
        let assetTotalSupply=0;
        for(let i=0;i<prevAssetBalances.length;i++) {
            assetBalances[i] = prevAssetBalances[i] - (i===index ? amountPayment : 0)
        }
        assetTotalSupply = assetBalances.reduce((acc,cur) => acc + cur,0)
        return [assetBalances, assetTotalSupply]
    }
    async incrementBalancesByAmounts(prevAssetBalances:number[],requirementAmountNormalized:number[],masAssetsPayment:Asset[]):Promise<[number[],number]>
    {
        const assetBalances:number[] = [];
        let assetTotalSupply=0;
        for(let i=0;i<prevAssetBalances.length;i++) {
            const assetDecimal = await this.getAssetDecimals(masAssetsPayment[i].assetId)
            outConsoleOrAllure('requirementAmountNormalized: ',requirementAmountNormalized[i])
            assetBalances[i] = prevAssetBalances[i] + requirementAmountNormalized[i]
        }
        assetTotalSupply = assetBalances.reduce((acc,cur) => acc + cur,0)
        return [assetBalances, assetTotalSupply]
    }

    async calculateLpTokensToMint(depositAmount:number,prevAssetTotalSupply:number) {
        const storage =  await getDataValue(this.contract, this.paramContract.KEY_STORAGE, this.network) as string
        const lpTotalSupply = Number(storage.split(this.paramContract.SEP)[2])//must refactor like paramContract !!!
        if (prevAssetTotalSupply == 0) {
            return depositAmount
        } else {
            return Math.floor(depositAmount*lpTotalSupply/prevAssetTotalSupply)
        }
    }
    getChange(masValuesPayment:number[],masRequirementAmounts:number[]) {
        const masChange:number[] = []
        for(let i=0; i<masValuesPayment.length;i++ ) {
            masChange.push(masValuesPayment[i]-masRequirementAmounts[i])
        }
        return masChange
    }
    async getLpDecimals() {
        const storage =  await getDataValue(this.contract, this.paramContract.KEY_STORAGE, this.network) as string
        const lpTokenId = storage.split(this.paramContract.SEP)[0]
        const laAssetInfo = await this.getAssetInfo(lpTokenId)
        return laAssetInfo.decimals
    }

    async getAssetDecimals(assetId:string) {
        const assetInfo = await this.getAssetInfo(assetId)
        return assetInfo.decimals
    }
    async getMasRequirementAmounts(masAssetsPayment: Asset[],prevAssetBalances:number[],assetWeights: number[], prevAssetTotalSupply: number,depositAmount: number,sigmaWeight:number) {
        let masRequirementAmounts:number[] = [];
        let masRequirementAmountsNormalized:number[] = [];
        const lpDecimals = await this.getLpDecimals()
        prevAssetTotalSupply != 0 ? outConsoleOrAllure('ratio with convert to Bigint: ', Math.floor(Number(BigInt(depositAmount) * this.paramContract.PERCENT_FACTOR / BigInt(prevAssetTotalSupply)))) : null
        for(let i=0; i< assetWeights.length; i++) {
            if (prevAssetTotalSupply == 0) {
                const a = Math.floor(assetWeights[i]*depositAmount/sigmaWeight)
                masRequirementAmountsNormalized.push(a)
                masRequirementAmounts.push(this.getNormalized(a,lpDecimals,masAssetsPayment[i].decimals,"CEILING"))
            } else {
                const ratio = Math.floor(Number(BigInt(depositAmount) * this.paramContract.PERCENT_FACTOR / BigInt(prevAssetTotalSupply)))
                const a = Math.floor(Number(BigInt(ratio) * BigInt(prevAssetBalances[i]) / this.paramContract.PERCENT_FACTOR))
                masRequirementAmountsNormalized.push(a)
                masRequirementAmounts.push(this.getNormalized(a,lpDecimals,masAssetsPayment[i].decimals,"CEILING")) // toNumber??????
            }
        }
        return [masRequirementAmounts,masRequirementAmountsNormalized]

    }
    async loadAssetBalances():Promise<[number[], number]>  {
        const assetBalancesRaw = await getDataValue(this.contract, this.paramContract.KEY_ASSET_BALANCES, this.network) as string
        const prevAssetBalances = assetBalancesRaw.split(this.paramContract.SEP).map(Number)
        let prevAssetTotalSupply = prevAssetBalances.reduce((acc,cur) => acc + cur,0)
        return [prevAssetBalances, prevAssetTotalSupply]
    }
    getNormalized(amount:number,sourceDecimals:number,targetDecimals:number,round:"DOWN"|"CEILING") {
        if (sourceDecimals >= targetDecimals) {
            if (round == "DOWN") {
                    return Math.floor(amount / 10 ** (sourceDecimals - targetDecimals))
            } else {
                    return Math.ceil(amount / 10 ** (sourceDecimals - targetDecimals))
            } // need to test
        }
        else {
            return Math.floor(amount* 10**(targetDecimals-sourceDecimals))
        }
    }
    async getAssetInfo (assetId_: string) {
        return await fetchDetails(this.network.nodeAPI, assetId_);
    };
    async getAssetsPaymentNormalized(masAssetsPayment:Asset[],masValuesPayment:number[]) {
        const masNormalizedPaymentAssets: number[] = [];
        const lpDecimals = await this.getLpDecimals()
        for(let i=0; i<masValuesPayment.length; i++ ) {
            const assetInfo = await   this.getAssetInfo(masAssetsPayment[i].assetId)
            const normalisedAmount = this.getNormalized(masValuesPayment[i],lpDecimals,assetInfo.decimals,"CEILING")//0728 changed masValuesPayment[i],assetInfo.decimals,this.paramContract.INT_DECIMALS
            masNormalizedPaymentAssets.push(normalisedAmount)
        }
        return masNormalizedPaymentAssets
    }
    getTotalSupply(balanceAssetsBefore:number[]) {
        return balanceAssetsBefore.reduce((acc,cur) => acc + cur,0)
    }

    async getAssetWeightsAndSigma(   key: string,   ):Promise<[number[], number]>       {
        const weightsRow = await getDataValue(this.contract, key, this.network) as string
        const assetWeights = weightsRow.split(this.paramContract.SEP).map(Number)
        let sigmaWeight = assetWeights.reduce((acc,cur) => acc + cur,0)
        return [assetWeights, sigmaWeight]
    }
    async getAssets() {
        const assetsRaw = await getDataValue(this.contract, this.paramContract.KEY_ASSETS, this.network) as string
        const assets = assetsRaw.split(this.paramContract.SEP)
        return assets
    }

    validateLiquidityInvariant(
        prevAssetBalances_:number[],
        prevAssetTotalSupply_:number,
        assetBalances_: number[],
        assetTotalSupply_: number,
        prevLpTotalSupply_: number,
        lpTotalSupply_: number,
        assetWeights_: number[],
        sigmaWeight_: number,
        weightAmplifier_: number,
        slippageRate_: number,
        feeMaxRate_: number){
        outConsoleOrAllure('Calculate validateLiquidityInvariant....')
        if ((prevLpTotalSupply_ === 0) || (lpTotalSupply_ === 0)) {
            outConsoleOrAllure('(prevLpTotalSupply_ === 0) || (lpTotalSupply_ === 0)');
            return true
        } else {
            let prevAssetsRate = (
                prevAssetTotalSupply_ - Math.floor(this.calculateFee(
                    prevAssetBalances_,
                    prevAssetTotalSupply_,
                    assetWeights_,
                    sigmaWeight_,
                    weightAmplifier_,
                    slippageRate_,
                    feeMaxRate_
                )*this.paramContract.RATE_FACTOR/ prevLpTotalSupply_)
            )
            let newAssetsRate = (
                assetTotalSupply_ - Math.floor(this.calculateFee(
                    assetBalances_,
                    assetTotalSupply_,
                    assetWeights_,
                    sigmaWeight_,
                    weightAmplifier_,
                    slippageRate_,
                    feeMaxRate_
                )* this.paramContract.RATE_FACTOR/lpTotalSupply_)
            )
            let diff = newAssetsRate - prevAssetsRate
            outConsoleOrAllure('prevAssetsRate: ',prevAssetsRate)
            outConsoleOrAllure('newAssetsRate: ',newAssetsRate)
            outConsoleOrAllure('diff: ',diff)
            if (diff <= 0 && diff < -1 * this.paramContract.RATE_FACTOR) {
                outConsoleOrAllure(`EXCEPTION!!! throw("_validateLiquidityInvariant: revert: diff=${diff}" + diff.toString())`)

            } else {return true}
        }
    }

    calculateFee(balances: number[],assetsTotalSupply:number, weights:number[],sigmaWeight:number,weightAmplifier:number,slippageRate:number,
                 feeMaxRate:number) {
        let sumFee:number=0;
        balances.forEach((balance,index) => {
            const equilibrium = Math.floor(assetsTotalSupply*weights[index]/sigmaWeight)
            const result = this.calculateMicroFee(balance,equilibrium,weightAmplifier,slippageRate,feeMaxRate)
            sumFee += result
        })
        return sumFee
    }

    calculateMicroFee(balance: number,equilibrium:number,weightAmplifier:number,slippageRate:number,
                      feeMaxRate:number) {
        if (balance < equilibrium) {
            const threshold = Math.floor(equilibrium*(this.paramContract.MAX_WEIGHT_AMPLIFIER-weightAmplifier)/this.paramContract.MAX_WEIGHT_AMPLIFIER)
            outConsoleOrAllure('balance < equilibrium, threshold: ',threshold)
            if(balance < threshold) {
                const maxDeviation = threshold - balance
                const feeRate = Math.floor(Math.floor(maxDeviation*slippageRate/this.paramContract.SLIPPAGE_RATE_FACTOR)*this.paramContract.FEE_RATE_FACTOR/equilibrium)
                if (feeRate > feeMaxRate) {
                    outConsoleOrAllure('calculateMicroFee balance < threshold: return maxDeviation * feeMaxRate: ',maxDeviation * feeMaxRate)
                    return maxDeviation * feeMaxRate
                } else {
                    outConsoleOrAllure('calculateMicroFee balance < threshold: return maxDeviation * feeRate: ',maxDeviation * feeRate)
                    return maxDeviation * feeRate
                }
            } else {
                outConsoleOrAllure('calculateMicroFee balance < threshold: return  0')
                return 0
            }
        } else {
            const threshold = Math.floor(equilibrium*(this.paramContract.MAX_WEIGHT_AMPLIFIER + weightAmplifier)/this.paramContract.MAX_WEIGHT_AMPLIFIER)
            outConsoleOrAllure('balance > equilibrium, threshold: ',threshold)
            if(balance > threshold) {
                const maxDeviation = balance - threshold
                const feeRate = Math.floor(Math.floor(maxDeviation*slippageRate/this.paramContract.SLIPPAGE_RATE_FACTOR)*this.paramContract.FEE_RATE_FACTOR/equilibrium)
                if (feeRate > feeMaxRate) {
                    outConsoleOrAllure('calculateMicroFee balance > threshold: maxDeviation * feeMaxRate: ',maxDeviation * feeMaxRate)
                    return maxDeviation * feeMaxRate
                } else {
                    outConsoleOrAllure('calculateMicroFee balance > threshold: maxDeviation * feeRate: ',maxDeviation * feeRate)
                    return maxDeviation * feeRate
                }
            } else {
                outConsoleOrAllure('calculateMicroFee balance > threshold: 0')
                return 0
            }
        }
    }
}
