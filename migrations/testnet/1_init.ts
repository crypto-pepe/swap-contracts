import {
  NetworkConfig,
  deployRawScript,
  ProofsGenerator,
  data,
  transfer,
  estimateFeeForScript,
  compileScript,
} from '@pepe-team/waves-sc-test-utils';
import path = require('path');
import { address, seedWithNonce, keyPair } from '@waves/ts-lib-crypto';

export default async function (
  deployerSeed: string,
  network: NetworkConfig,
  proofsGenerator: ProofsGenerator
) {
  const deployerPrivateKey = keyPair(deployerSeed).privateKey;
  const contract = keyPair(seedWithNonce(deployerSeed, 1));
  const contractAddress = address(
    { publicKey: contract.publicKey },
    network.chainID
  );

  const migrationsScript = await compileScript(
    path.resolve(process.cwd(), './ride/migrations.ride')
  );

  const deployFee = estimateFeeForScript(migrationsScript.size);

  await transfer(
    {
      amount: deployFee + network.invokeFee,
      recipient: contractAddress,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  );

  await deployRawScript(
    migrationsScript.base64,
    contract.privateKey,
    network,
    proofsGenerator,
    deployFee
  );

  await data(
    {
      data: [
        {
          key: 'LAST_COMPLETED_MIGRATION',
          type: 'integer',
          value: 1,
        },
        {
          key: 'OWNER',
          type: 'string',
          value: address(deployerSeed, network.chainID),
        },
      ],
      fee: network.invokeFee,
    },
    contract.privateKey,
    network,
    proofsGenerator
  );

  return true;
}
