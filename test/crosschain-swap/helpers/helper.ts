import { getAssetContractBalance, getAssetInfo} from "../../../steps/common";
import {Account, Asset, Contract, getBalance, getDataValue, NetworkConfig} from "@pepe-team/waves-sc-test-utils";
import {dropBalance} from "../../../steps/crosschain.swap";
import {InvokeScriptTransactionFromNode} from "@waves/ts-types";
import {allure} from "allure-mocha/runtime";


export function convertList2MapList(input:string[]) {
    return input.map((item) => {return {type: 'string', value: item};})
}

export function convertToMasPayments(masAssetsPayment:Asset[], masValuesPayment:number[]) {
    const payment: {assetId: string | null, amount: number}[] = []
    for(let i = 0; i < masAssetsPayment.length; i++) {
        payment.push({assetId: masAssetsPayment[i].assetId, amount: masValuesPayment[i]})
    }
    return payment
}

export function parseSTORAGE(input: string | unknown) {
    if (typeof input !== 'string') {
        throw new Error('Input is not a string')
    }
    const items = input.split('__')
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
    storage['protocolFeeContract'] = items[9];
    return storage
}

export function parseASSET_BALANCES(input: string | unknown) {
    if (typeof input !== 'string') {
        throw new Error('Input is not a string')
    }
    const items = input.split('__').map(Number)
    return items
}
export async function parseLP_FEE(contract:Contract,assetId: string | unknown,network:NetworkConfig) {
    if (typeof assetId !== 'string') {
        throw new Error('Input is not a string')
    }
    const lp_fee  = await getDataValue(contract, `LP_FEE__${assetId}`, network) as number
    return lp_fee
}

export async function parsePROTOCOL_FEE(contract:Contract,assetId: string | unknown,network:NetworkConfig) {
    if (typeof assetId !== 'string') {
        throw new Error('Input is not a string')
    }
    const lp_fee  = await getDataValue(contract, `PROTOCOL_FEE__${assetId}`, network) as number
    return lp_fee
}

export function findTransferToUserIntoTransaction(transaction: InvokeScriptTransactionFromNode,assets:Asset[],lpTokenId:string):[number[],number] {
    const transfers = transaction.stateChanges.transfers
    const masReturnFunds:number[] = []
    let sendLpToken: number =0;
    for(let i=0; i<assets.length;i++ ) {
        const sendAsset = transfers.filter((item) => item.asset == assets[i].assetId)
        if(sendAsset.length != 0) {
            masReturnFunds.push(<number>sendAsset[0].amount)
        } else {
            masReturnFunds.push(0)
        }
        const sendLpTokenFromTransfer = transfers.filter((item) => item.asset == lpTokenId)
        if(sendLpTokenFromTransfer.length != 0) {
            sendLpToken=sendLpTokenFromTransfer[0].amount as number
        }
    }
    return [masReturnFunds,sendLpToken]
}
export function findBurnLpToken(transaction: InvokeScriptTransactionFromNode,lpTokenId:string) {
    const burns = transaction.stateChanges.burns
    const burnLpToken = burns.filter((item) => item.assetId == lpTokenId)
    if(burnLpToken.length != 0) {
        return burnLpToken[0].quantity as number
    } else return 0
}

export function getHeightFromTransaction(transaction: InvokeScriptTransactionFromNode) {
    return transaction.height
}

export function calculateMicroFee(balance: number,equilibrium:number,weightAmplifier:number,slippageRate:number,
                                  feeMaxRate:number,maxWeightAmplifier:number,slippageRateFactor:number,feeRateFactor:number) {
  if (balance < equilibrium) {
    const threshold = equilibrium*(maxWeightAmplifier-weightAmplifier)/maxWeightAmplifier
      outConsoleOrAllure('balance < equilibrium, threshold: ',threshold)
      if(balance < threshold) {
        const maxDeviation = threshold - balance
        const feeRate = (maxDeviation*slippageRate/slippageRateFactor)*feeRateFactor/equilibrium
        if (feeRate > feeMaxRate) {
          outConsoleOrAllure('calculateMicroFee balance < threshold: maxDeviation * feeMaxRate: ',maxDeviation * feeMaxRate)
          return maxDeviation * feeMaxRate
        } else {
            outConsoleOrAllure('calculateMicroFee balance < threshold: maxDeviation * feeRate: ',maxDeviation * feeRate)
          return maxDeviation * feeRate
        }
      } else {
          outConsoleOrAllure('calculateMicroFee balance < threshold: 0')
        return 0
      }
  } else {
    const threshold = equilibrium*(weightAmplifier + weightAmplifier)/maxWeightAmplifier
      outConsoleOrAllure('balance > equilibrium, threshold: ',threshold)
    if(balance > threshold) {
      const maxDeviation = balance - threshold
      const feeRate = (maxDeviation*slippageRate/slippageRateFactor)*feeRateFactor/equilibrium
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

export function calculateFee(balances: number[],assetsTotalSupply:number, weights:number[],sigmaWeight:number,weightAmplifier:number,slippageRate:number,
                                  feeMaxRate:number,maxWeightAmplifier:number,slippageRateFactor:number,feeRateFactor:number) {
  let sumFee:number=0;
    balances.forEach((balance,index) => {
      const equilibrium = assetsTotalSupply*weights[index]/sigmaWeight
      const result = calculateMicroFee(balance,equilibrium,weightAmplifier,slippageRate,feeMaxRate,maxWeightAmplifier,slippageRateFactor,feeRateFactor)
      sumFee += result
    })
    return sumFee
}

export function validateLiqudityInvariant(
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
    feeMaxRate_: number,
    RATE_FACTOR:number,
    maxWeightAmplifier:number,slippageRateFactor:number,feeRateFactor:number){
    if ((prevLpTotalSupply_ === 0) || (lpTotalSupply_ === 0)) {
        outConsoleOrAllure('(prevLpTotalSupply_ === 0) || (lpTotalSupply_ === 0)');
        return true
    } else {
        let prevAssetsRate = (
            prevAssetTotalSupply_ - calculateFee(
                prevAssetBalances_,
                prevAssetTotalSupply_,
                assetWeights_,
                sigmaWeight_,
                weightAmplifier_,
                slippageRate_,
                feeMaxRate_,
                maxWeightAmplifier,slippageRateFactor,feeRateFactor
            )*RATE_FACTOR/ prevLpTotalSupply_
        )
        let newAssetsRate = (
            assetTotalSupply_ - calculateFee(
                assetBalances_,
                assetTotalSupply_,
                assetWeights_,
                sigmaWeight_,
                weightAmplifier_,
                slippageRate_,
                feeMaxRate_,
                maxWeightAmplifier,slippageRateFactor,feeRateFactor
            )* RATE_FACTOR/lpTotalSupply_
        )
        let diff = newAssetsRate - prevAssetsRate
        outConsoleOrAllure('prevAssetsRate: ',prevAssetsRate)
        outConsoleOrAllure('newAssetsRate: ',newAssetsRate)
        outConsoleOrAllure('diff: ',diff)
        if (diff <= 0 && diff < -1 * RATE_FACTOR) {
            outConsoleOrAllure('throw("_validateLiquidityInvariant: revert: diff=" + diff.toString())')
            throw("_validateLiquidityInvariant: revert: diff=" + diff.toString())
        } else {return true}
    }
}

export function getChange(paymentAmount:number, requiredAmount:number) {
    if (paymentAmount > requiredAmount) {
        return paymentAmount - requiredAmount
    } else {
        return 0
    }
}

export async function getAssetBalances(contract: Contract, key: string, network: NetworkConfig,INT_DECIMALS:number):Promise<[number[], number]> {
    const assetsRow = await getDataValue(contract, key, network) as string
    const assets = assetsRow.split('__')
    const assetBalances: number[] = [];
    let assetTotalSupply : number = 0 ;
    for (let asset of assets) {
        const assetBalance = await getAssetContractBalance(asset, contract, network);
        const assetInfo = await getAssetInfo(asset)
        const normalisedAssetBalance = getNormalized(assetBalance,assetInfo.decimals,INT_DECIMALS)
        assetBalances.push(normalisedAssetBalance);
        assetTotalSupply = assetTotalSupply + normalisedAssetBalance;
    }
    return [assetBalances, assetTotalSupply ]
}

export function getPrevAssetBalances(masBalances:number[],payment:any[]):(number[] | number)[] {
    const prevAssetBalances: number[] = [];
    let prevAssetTotalSupply:number = 0;
    masBalances.forEach((balance,index) => {
        prevAssetBalances.push(balance - Number(payment[index].amount));
        prevAssetTotalSupply = prevAssetTotalSupply + prevAssetBalances[index];
    })
    return [prevAssetBalances, prevAssetTotalSupply]
}

export async function getAssetWeightsAndSigma(contract: Contract,     key: string,     network: NetworkConfig):Promise<[number[], number]>       {
    const weightsRow = await getDataValue(contract, key, network) as string
    const assetWeights = weightsRow.split('__').map(Number)
    let sigmaWeight = assetWeights.reduce((acc,cur) => acc + cur,0)
    return [assetWeights, sigmaWeight]
}

export async function getRequirementAmount(prevAssetBalances:number[],ratio:number,PERCENT_FACTOR:number,) {
    const res = prevAssetBalances.map((x) => {
        return ratio*x/PERCENT_FACTOR
    })
    return res
}

export async function getPaymentAssetAndNormalizated(payment:{assetId:string,amount:number}[],INT_DECIMALS: number) {
    const masNormalizedPaymentAssets: number[] = [];
    for(let paymentAsset of payment){
        const assetInfo = await getAssetInfo(paymentAsset.assetId)
        const normalisedAmount = getNormalized(paymentAsset.amount,assetInfo.decimals,INT_DECIMALS)
        masNormalizedPaymentAssets.push(normalisedAmount)
    }
    return masNormalizedPaymentAssets
}

export function getNormalized(amount:number,sourceDecimals:number,targetDecimals:number) {
    if (sourceDecimals >= targetDecimals) {
        return amount/10**(sourceDecimals-targetDecimals)
    }
else {
    return amount* 10**(targetDecimals-sourceDecimals)
    }
}

export async function cleanBalanceContract(assets:Asset[],user:Account,contract:Contract,network: NetworkConfig) {
    for (let asset of assets) {
        const assetBalance = await getAssetContractBalance(asset, contract, network);
        if (assetBalance > 0) {
            outConsoleOrAllure(`clean balance(${assetBalance}) of the asset ${asset.name} by contract `)
            await dropBalance(user, asset, contract,network)
        }
        const balanceWaves = await getBalance(contract.dApp,network)
        const assetWaves:Asset={
            name: 'assetWaves',
            description: 'assetWaves',
            quantity: balanceWaves,
            decimals: 8,
            assetId: ''
        }
    }
}
export function wait(time_wait: number, rate: string) {
    let divider = 1;
    if (rate === 'ms') {
        divider = 1
    } else if (rate === 's') {
        divider = 1000
    } else {
        outConsoleOrAllure('Error inside function wait - incorrect param rate !!!')
    }
    let start = Date.now() / divider,
        now = start;
    while (now - start < time_wait) {
        now = Date.now() / divider;
    }
}
function replacer(key: any, value: { toString: () => any; }) {
    if (typeof value === 'bigint') {
        return {
            type: 'bigint',
            value: value.toString()
        };
    } else {
        return value;
    }
}

export function outConsoleOrAllure(name:string,value:any=undefined) {
    if (process.env.CONSOLE === 'true') {
        value !== undefined ? console.log(`${name}: ${JSON.stringify(value, replacer, 2)}`) : console.log(`${name}`)
    } else {
        value !== undefined ?  allure.createAttachment(`${name}: `, JSON.stringify(value, replacer, 2),'application/json' as any) :
            allure.logStep(`${name}`)
    }
}





