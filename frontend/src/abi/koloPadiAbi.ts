export const koloPadiAbi = [
  {
    "type": "function",
    "name": "breakKolo",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claim",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createKolo",
    "inputs": [
      {
        "name": "depositAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochLength",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "durationEpochs",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "padi",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "currentEpochIndex",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "depositedEpochs",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getKolo",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "padi",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "depositAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochLength",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "durationEpochs",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalSaved",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "depositedCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentStreak",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum KoloPadi.Status"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getKolosByOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getKolosByPadi",
    "inputs": [
      {
        "name": "padi",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isEpochMissed",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isEpochSlashable",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "kolos",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "padi",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "depositAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochLength",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "durationEpochs",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalSaved",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "depositedCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentStreak",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum KoloPadi.Status"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextKoloId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "secondsUntilNextEpoch",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "slashMiss",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "slashedEpochs",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Broken",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "ownerPayout",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "padiPayout",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Claimed",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Deposited",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalSaved",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "KoloCreated",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "padi",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "depositAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "epochLength",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "durationEpochs",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Slashed",
    "inputs": [
      {
        "name": "koloId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "epochIndex",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "padi",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "DepositAmountMustBePositive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DurationTooShort",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EpochAlreadyDeposited",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EpochAlreadySlashed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EpochLengthTooShort",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EpochNotYetMissed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EthTransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "IncorrectDepositValue",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidEpochIndex",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidKoloId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "KoloDurationEnded",
    "inputs": []
  },
  {
    "type": "error",
    "name": "KoloNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "KoloStillOngoing",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotKoloOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotKoloPadi",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PadiCannotBeOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PadiCannotBeZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Reentrant",
    "inputs": []
  }
] as const;
