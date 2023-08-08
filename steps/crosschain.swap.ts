import {Account, Asset, Contract, invoke, NetworkConfig, transfer} from "@pepe-team/waves-sc-test-utils";
import {getEnvironment} from "relax-env-json";
import {getAssetContractBalance} from "./common";
import {fetchEvaluate} from "@waves/node-api-js/cjs/api-node/utils";

const env = getEnvironment();
let contract: Contract;

export const setContract = (contract_: Contract) => {
    contract = contract_;
};
export const init = async (
    assets_: any[],
    assetWeights_: any[],
    lpFeeRate_: number,
    protocolFeeRate_: number,
    lpTokenName_: string,
    lpTokenDescr_: string,
    lpTokenDecimals_: number,
    maxAllocationAmplifier_: number,
    weightAmplifier_: number,
    slippageRate_: number | string,
    feeMaxRate_: number | string,
    protocolFeeContract_: string,
    sender_: Account | Contract = contract,
    contract_: Contract = contract
) => {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'init',
                args: [
                    { type: 'list', value: assets_ },
                    { type: 'list', value: assetWeights_ },
                    { type: 'integer', value: lpFeeRate_ },
                    { type: 'integer', value: protocolFeeRate_ },
                    { type: 'string', value: lpTokenName_ },
                    { type: 'string', value: lpTokenDescr_ },
                    { type: 'integer', value: lpTokenDecimals_ },
                    { type: 'integer', value: maxAllocationAmplifier_ },
                    { type: 'integer', value: weightAmplifier_ },
                    { type: 'integer', value: slippageRate_ },
                    { type: 'integer', value: feeMaxRate_ },
                    { type: 'string', value: protocolFeeContract_ },
                ],
            },
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {}
};

export const depositAll = async (
    amount_: number | string| bigint,
    payment: {assetId: string | null, amount: number}[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'depositAll',
                args: [
                    { type: 'integer', value: amount_.toString() },
                ],
            },
            payment: payment,
        },
        privateKey,
        env.network
    );
    // return res
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const deposit = async (
    amount_: number | string| bigint,
    payment: any[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'deposit',
                args: [
                    { type: 'integer', value: amount_.toString() },
                ],
            },
            payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const getDeposit = async (
    assetId_: string,
    amount_: number | string | bigint,
    // payment: any[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'getDeposit',
                args: [
                    { type: 'string', value: assetId_ },
                    { type: 'integer', value: amount_.toString() },
                ],
            },
            // payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const fetchEvaluateSwap = async (
    address_: string,
    functionName: string,
    args: any[],
) => {
    console.log('fetchEvaluateSwap: ', functionName, args)
    switch (functionName) {
        case 'getDepositAll':{
            const resultRaw = await fetchEvaluate(env.network.nodeAPI, address_, `getDepositAll(${args[0]})`);
            const result = JSON.parse(JSON.stringify(resultRaw));
            // console.log('result: ',result)//JSON.stringify(result,null,2))
            return {lpTokensToMint:result.result.value._2.value._1.value, requiredAmountsNormalized:result.result.value._2.value._2.value.map((x:{type: any,value: any})=>x.value)}
        }
        case 'getDeposit':{
            const resultRaw = await fetchEvaluate(env.network.nodeAPI, address_, `getDeposit("${args[0]}",${args[1]})`);
            const result = JSON.parse(JSON.stringify(resultRaw));
            // console.log('result: ',JSON.stringify(result))//JSON.stringify(result,null,2))
            return {lpTokensToMint:result.result.value._2.value}
        }
        case 'getWithdrawAll':{
            const resultRaw = await fetchEvaluate(env.network.nodeAPI, address_, `getWithdrawAll(${args[0]})`);
            const result = JSON.parse(JSON.stringify(resultRaw));
            // console.log('result: ',JSON.stringify(result))//JSON.stringify(result,null,2))
            return {balancesToGet:result.result.value._2.value.map((x:{type: any,value: any})=>x.value)}
        }
        case 'getWithdraw':{
            const resultRaw = await fetchEvaluate(env.network.nodeAPI, address_, `getWithdraw("${args[0]}",${args[1]})`);
            const result = JSON.parse(JSON.stringify(resultRaw));
            // console.log('result: ',JSON.stringify(result))//JSON.stringify(result,null,2))
            return {requiredLpTokens:result.result.value._2.value}
        }
        case 'getSwap':{
            const resultRaw = await fetchEvaluate(env.network.nodeAPI, address_, `getSwap("${args[0]}","${args[1]}",${args[2]})`);
            const result = JSON.parse(JSON.stringify(resultRaw));
            // console.log('result: ',JSON.stringify(result))//JSON.stringify(result,null,2))
            return {finalAmount:result.result.value._2.value}
        }
        case 'getClaim':{
            const resultRaw = await fetchEvaluate(env.network.nodeAPI, address_, `getClaim("${args[0]}")`);
            const result = JSON.parse(JSON.stringify(resultRaw));
            console.log('result: ',JSON.stringify(result))//JSON.stringify(result,null,2))
            return {userProfits:result.result.value._2.value.map((x:{type: any,value: any})=>x.value)}
        }
        default:
        {console.log('Error!!! Get invalid name function ')}
    }
};

export const withdrawAll = async (
    payment: any[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'withdrawAll',
            },
            payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const getWithdrawAll = async (
    amount_: number | string | bigint,
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'getWithdrawAll',
                args: [
                    { type: 'integer', value: amount_.toString() },
                ],
            },
            // payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const withdraw = async (
    assetId_: string,
    amount_: number | string| bigint,
    payment: any[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'withdraw',
                args: [
                    { type: 'string', value: assetId_ },
                    { type: 'integer', value: amount_.toString() },
                ],
            },
            payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const swap = async (
    targetAssetId_: string,
    minAmount_: number,
    payment_: any[] = [],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
) => {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const  res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'swap',
                args: [
                    { type: 'string', value: targetAssetId_ },
                    { type: 'integer', value: minAmount_ },
                ],
            },
            payment: payment_,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {}
};

export const stake = async (
    payment: any[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'stake'
            },
            payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const unstake = async (
    amount_: number | string| bigint,
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'unstake',
                args: [
                    { type: 'integer', value: amount_.toString() },
                ],
            },
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const claim = async (
    user:string,
    assets_: any[],
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'claim',
                args: [
                    { type: 'string', value: user },
                    { type: 'list', value: assets_ },
                ],
            },
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const checkpoint = async (
    user:string,
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'checkpoint',
                args: [
                    { type: 'string', value: user },
                ],
            },
            // payment: payment,
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const pause = async (
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'pause',
            },
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const unpause = async (
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'unpause',
            },
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const updatePauser = async (
    pauser:string,
    sender_: Account | Contract = contract,
    contract_: Contract = contract
)=> {
    // eslint-disable-next-line prettier/prettier
    const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
    const res = await invoke(
        {
            dApp: contract_.dApp,
            call: {
                function: 'updatePauser',
                args: [
                    { type: 'string', value: pauser },
                ],
            },
        },
        privateKey,
        env.network
    );
    return res !== undefined ? JSON.parse(JSON.stringify(res)) : {} //JSON.parse(JSON.stringify(res));
};

export const dropBalance = async (
    user_: Account,
    token: Asset,
    contract: Contract,
    network:NetworkConfig
) => {
    transfer(
        {
            recipient: user_.address,
            assetId: token.assetId,
            amount: await getAssetContractBalance(token, contract, env.network),
        },
        {privateKey: contract.privateKey},
        network
    );
};
export const dropBalanceDen = async (
    user_: Account,
    token: Asset
) => {
    transfer(
        {
            recipient: user_.address,
            assetId: token.assetId,
            amount: await getAssetContractBalance(token, contract, env.network),
        },
        {privateKey: contract.privateKey},
        env.network
    );
};
