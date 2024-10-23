# offchain/model_evaluation.py

import os
import json
import web3
import requests
from ocean_lib.ocean.ocean import Ocean
from ocean_lib.config import Config
from ocean_lib.services.service import Service
from ocean_lib.assets.asset import Asset
from ocean_lib.models.compute_input import ComputeInput
from web3 import Web3

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()

# Global settings
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
OCEAN_RPC_URL = os.getenv("OCEAN_RPC_URL")
OCEAN_WALLET_ADDRESS = os.getenv("OCEAN_WALLET_ADDRESS")
SAPPHIRE_RPC_URL = os.getenv("SAPPHIRE_RPC_URL")
MODEL_TOKEN_ID = os.getenv("MODEL_TOKEN_ID")  # Tokenized representation of the model on-chain

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(SAPPHIRE_RPC_URL))

# Initialize Ocean Protocol client
config = Config('config.ini')  # Adjust with your Ocean config file path
ocean = Ocean(config)


def get_ocean_asset(asset_did):
    """
    Retrieve the asset details from Ocean Protocol using its DID.
    """
    asset = ocean.assets.resolve(asset_did)
    return asset


def evaluate_model(asset_did, model_params):
    """
    This function triggers an off-chain evaluation of an AI model using Ocean's compute-to-data.
    The model_params argument can contain specific hyperparameters or dataset information.
    
    :param asset_did: The DID of the dataset or model asset stored on Ocean Protocol.
    :param model_params: Hyperparameters or other configuration options for the model evaluation.
    :return: Evaluation results or status.
    """
    asset = get_ocean_asset(asset_did)

    # Ensure the asset supports compute-to-data services
    service = None
    for serv in asset.services:
        if serv.type == 'compute':
            service = serv
            break

    if not service:
        raise ValueError(f"Asset {asset_did} does not support compute-to-data.")

    # Create a compute input object
    compute_input = ComputeInput(asset, service)

    # Set up model training/evaluation parameters
    job_id = ocean.compute.start(
        dataset=compute_input,
        consumer_wallet=ocean.wallet, 
        algorithm_did=None,  # Add if you have an algorithm to execute
        algorithm_meta=model_params  # Pass any model params if needed
    )

    print(f"Started compute job with ID: {job_id}")
    return job_id


def check_compute_job_status(job_id):
    """
    Check the status of a compute-to-data job on Ocean Protocol.
    :param job_id: The ID of the compute job.
    :return: The status of the job.
    """
    status = ocean.compute.status(ocean.assets.resolve(MODEL_TOKEN_ID), job_id, ocean.wallet)
    return status


def fetch_compute_result(job_id, result_index=0):
    """
    Fetch the result of a completed compute-to-data job.
    :param job_id: The ID of the compute job.
    :param result_index: Index of the result file (if multiple results are generated).
    :return: Path to the result file.
    """
    compute_result = ocean.compute.result(ocean.assets.resolve(MODEL_TOKEN_ID), job_id, result_index, ocean.wallet)
    
    if compute_result:
        result_url = compute_result[0]['url']
        response = requests.get(result_url)
        result_file = f"model_result_{job_id}.json"
        
        with open(result_file, 'wb') as file:
            file.write(response.content)

        print(f"Results downloaded to {result_file}")
        return result_file
    else:
        print(f"No results found for job {job_id}")
        return None


def report_result_on_chain(job_id, result_file):
    """
    Report the result of a compute job back to the on-chain system via ROFL.
    :param job_id: ID of the compute job.
    :param result_file: Path to the result file.
    :return: On-chain transaction hash.
    """
    # Read the result file
    with open(result_file, 'r') as file:
        result_data = json.load(file)

    # Generate the result hash to be sent to the smart contract
    result_hash = w3.keccak(text=str(result_data))

    # Assuming we have a deployed smart contract for model evaluation on Sapphire
    contract_address = os.getenv("MODEL_CONTRACT_ADDRESS")
    abi = json.loads(os.getenv("MODEL_CONTRACT_ABI"))

    contract = w3.eth.contract(address=contract_address, abi=abi)
    nonce = w3.eth.getTransactionCount(OCEAN_WALLET_ADDRESS)

    # Prepare the transaction
    tx = contract.functions.submitEvaluationResult(job_id, result_hash).buildTransaction({
        'nonce': nonce,
        'gas': 3000000,
        'gasPrice': w3.toWei('20', 'gwei'),
        'from': OCEAN_WALLET_ADDRESS
    })

    # Sign the transaction with the private key
    signed_tx = w3.eth.account.signTransaction(tx, PRIVATE_KEY)

    # Send the transaction to the Sapphire blockchain
    tx_hash = w3.eth.sendRawTransaction(signed_tx.rawTransaction)
    print(f"Submitted evaluation result with transaction hash: {tx_hash.hex()}")
    return tx_hash.hex()


if __name__ == "__main__":
    # Example usage:
    
    # Example model evaluation params (these can be adjusted as needed)
    model_params = {
        "epochs": 5,
        "learning_rate": 0.001,
        "batch_size": 64,
    }

    # Step 1: Trigger model evaluation
    asset_did = "did:op:123456789abcdef"  # Replace with the actual DID from Ocean
    job_id = evaluate_model(asset_did, model_params)

    # Step 2: Check the status of the compute job
    status = check_compute_job_status(job_id)
    print(f"Job status: {status}")

    # Step 3: Fetch and report the result once complete
    if status == 'completed':
        result_file = fetch_compute_result(job_id)
        if result_file:
            report_result_on_chain(job_id, result_file)
