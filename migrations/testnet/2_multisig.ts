import path = require('path');
import {
  compileScript,
  deployRawScript,
  estimateFeeForScript,
  ProofsGenerator,
  invoke,
  transfer,
  NetworkConfig,
} from '@pepe-team/waves-sc-test-utils';
import { address, seedWithNonce, keyPair } from '@waves/ts-lib-crypto';
import { InvokeScriptCallStringArgument } from '@waves/ts-types';

export default async function (
  deployerSeed: string,
  network: NetworkConfig,
  proofsGenerator: ProofsGenerator
) {
  const deployerPrivateKey = keyPair(deployerSeed).privateKey;
  const contract = keyPair(seedWithNonce(deployerSeed, 2));
  const contractAddress = address(
    { publicKey: contract.publicKey },
    network.chainID
  );
  console.log('Multisig contract address =', contractAddress);

  const multisigScript = await compileScript(
    path.resolve(process.cwd(), './ride/multisig.ride')
  );
  const deployFee = estimateFeeForScript(multisigScript.size);

  await transfer(
    {
      amount: deployFee + network.invokeFee,
      recipient: contractAddress,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  await deployRawScript(
    multisigScript.base64,
    contract.privateKey,
    network,
    proofsGenerator,
    deployFee
  ).catch((e) => {
    throw e;
  });

  const publicKeys: InvokeScriptCallStringArgument[] = [
    {
      type: 'string',
      value: 'yMQKms5WvLvobErygwGjByEuNuebLMGXHndfVDsjMVD',
    },
    {
      type: 'string',
      value: 'BN9meJdnaezqtUK7iGhWC9a6TvgU51ESc69wT8x7AnN8',
    },
    {
      type: 'string',
      value: 'ENV5mvh5GsDNHhqwYt1BzxfZew1M3rRRzXub5vaGxY3C',
    },
    {
      type: 'string',
      value: 'nobcGCfJ1ZG1J6g8T9dRLoUnBCgQ6DM5H8Hy78sAmSN',
    },
    {
      type: 'string',
      value: 'Hv2T217jAFbgjXiqrz2CKQkbFH9CJc9dFAgwcQmi3Q83',
    },
  ];

  let defaultQuorum = 2;
  switch (network.name) {
    case 'mainnet':
      defaultQuorum = 3;
  }

  await invoke(
    {
      dApp: contractAddress,
      call: {
        function: 'init',
        args: [
          {
            type: 'list',
            value: publicKeys,
          },
          {
            type: 'integer',
            value: defaultQuorum,
          },
        ],
      },
      fee: network.invokeFee,
    },
    deployerPrivateKey,
    network,
    proofsGenerator
  ).catch((e) => {
    throw e;
  });

  return true;
}
