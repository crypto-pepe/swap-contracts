import {
  NetworkConfig,
  compileScript,
  deployRawScript,
  estimateFeeForScript,
  ProofsGenerator,
  data,
  transfer,
  invoke,
} from '@pepe-team/waves-sc-test-utils';
import path = require('path');
import { address, seedWithNonce, keyPair } from '@waves/ts-lib-crypto';

export default async function (
  deployerSeed: string,
  network: NetworkConfig,
  proofsGenerator: ProofsGenerator
) {
  const deployerPrivateKey = keyPair(deployerSeed).privateKey;

  const multisigAddress = address(
    { publicKey: keyPair(seedWithNonce(deployerSeed, 2)).publicKey },
    network.chainID
  );
  console.log('Multisig contract address =', multisigAddress);

  const crosschainSwapContract = keyPair(seedWithNonce(deployerSeed, 3));
  const crosschainSwapContractAddress = address(
    { publicKey: crosschainSwapContract.publicKey },
    network.chainID
  );

  const crosschainSwapScript = await compileScript(
    path.resolve(process.cwd(), './ride/crosschain_swap.ride')
  );
  const deployFee = estimateFeeForScript(crosschainSwapScript.size);

  await transfer(
    {
      amount: deployFee + 2 * network.invokeFee + 100000000,
      recipient: crosschainSwapContractAddress,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  );

  await deployRawScript(
    crosschainSwapScript.base64,
    crosschainSwapContract.privateKey,
    network,
    proofsGenerator,
    deployFee
  );

  await invoke(
    {
      dApp: crosschainSwapContractAddress,
      call: {
        function: 'setMultisig',
        args: [
          {
            type: 'string',
            value: multisigAddress,
          },
        ],
      },
    },
    crosschainSwapContract.privateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  const tokenName = 'USDT-PPT';
  const tokenDescr =
    'USDT crosschain token powered by PepeTeam Crosschain Bridge. See details at https://bridge.pepe.team/tokens/USDT-PPT';

  await invoke(
    {
      dApp: crosschainSwapContractAddress,
      call: {
        function: 'init',
        args: [
          {
            type: 'list',
            value: [
              {
                type: 'string',
                value: '9wc3LXNA4TEBsXyKtoLE9mrbDD7WMHXvXrCjZvabLAsi', // USDT-ERC20-PPT
              },
              {
                type: 'string',
                value: 'A81p1LTRyoq2rDR2TNxB2dWYxsiNwCSSi8sXef2SEkwb', // USDT-BEP20-PPT
              },
              {
                type: 'string',
                value: 'Cu6FRaNphvp1iwmnyVRAvcnyVgLEwBGwSvGQrVsThAAD', // USDT-POLY-PPT
              },
              {
                type: 'string',
                value: 'DaErMEp76HtuvbbSYxDwLovRimaAwtEyQGFeHLQ3UWwh', // USDT-TRC20-PPT
              },
            ],
          }, // assets_
          {
            type: 'list',
            value: [
              {
                type: 'string',
                value: '450000',
              },
              {
                type: 'string',
                value: '150000',
              },
              {
                type: 'string',
                value: '100000',
              },
              {
                type: 'string',
                value: '300000',
              },
            ],
          }, // assetWeights_
          { type: 'integer', value: 400 }, // lpFeeRate_
          { type: 'integer', value: 100 }, // protocolFeeRate_
          { type: 'string', value: tokenName }, // lpTokenName_
          { type: 'string', value: tokenDescr }, // lpTokenDescr_
          { type: 'integer', value: 6 }, // lpTokenDecimals_
          { type: 'integer', value: 900000 }, // maxAllocationAmplifier_
          { type: 'integer', value: 800000 }, // weightAmplifier_
          { type: 'integer', value: 100000000 }, // slippageRate_
          { type: 'integer', value: 9000000 }, // feeMaxRate_
          { type: 'string', value: multisigAddress }, // protocolFeeContract_
          { type: 'integer', value: 10 }, // precision_
          { type: 'string', value: multisigAddress }, // pauser_
        ],
      },
      fee: network.invokeFee + 100000000,
    },
    crosschainSwapContract.privateKey,
    network,
    proofsGenerator
  );

  return true;
}
