# offchain/ocean_compute.py

import os
import time
from ocean_lib.ocean.ocean import Ocean
from ocean_lib.config import Config
from ocean_lib.ocean.util import to_wei
from ocean_lib.services.service import Service
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Global settings
OCEAN_RPC_URL = os.getenv("OCEAN_RPC_URL")
OCEAN_WALLET_ADDRESS = os.getenv("OCEAN_WALLET_ADDRESS")
OCEAN_PRIVATE_KEY = os.getenv("OCEAN_PRIVATE_KEY")
DATASET_DID = os.getenv("DATASET_DID")
ALGORITHM_DID = os.getenv("ALGORITHM_DID")  # DID for algorithm (if any)

# Initialize Ocean Protocol client
config = Config('config.ini')  # Adjust with your Ocean config file path
ocean = Ocean(config)
wallet = ocean.create_wallet(OCEAN_PRIVATE_KEY)

def start_compute_job(dataset_did, algo_did=None):
    """
    Start a compute-to-data job on Ocean Protocol for a specific dataset.
    Optionally, you can specify an algorithm DID for the compute job.
    
    :param dataset_did: DID of the dataset.
    :param algo_did: DID of the algorithm (optional).
    :return: Job ID of the compute job.
    """
    asset = ocean.assets.resolve(dataset_did)

    # Get the compute service (assuming it's the first service)
    compute_service = asset.get_service(Service.SERVICE_COMPUTE)
    
    # Prepare the dataset input for the compute job
    compute_input = [Service.compute_input(asset, compute_service)]

    # If algorithm DID is provided, add it to the inputs
    if algo_did:
        algo_asset = ocean.assets.resolve(algo_did)
        compute_input.append(Service.compute_input(algo_asset))

    # Define the amount of OCEAN tokens to pay for compute service
    ocean_amount = to_wei(1.0)  # Pay 1 OCEAN for the job

    # Start the compute job
    job = ocean.compute.start(
        wallet=wallet,
        dataset=asset,
        compute_service=compute_service,
        algorithm_did=algo_did if algo_did else None,
        job_inputs=compute_input,
        payment_amount=ocean_amount
    )

    print(f"Compute job started with job ID: {job['jobId']}")
    return job['jobId']


def check_job_status(dataset_did, job_id):
    """
    Check the status of an existing compute-to-data job.
    
    :param dataset_did: DID of the dataset.
    :param job_id: The job ID of the compute job.
    :return: Status of the job (e.g., 'Running', 'Completed', etc.).
    """
    asset = ocean.assets.resolve(dataset_did)
    compute_service = asset.get_service(Service.SERVICE_COMPUTE)
    
    job_status = ocean.compute.status(wallet, asset, job_id, compute_service)

    print(f"Job ID: {job_id} | Status: {job_status['status']}")
    return job_status['status']


def download_compute_results(dataset_did, job_id, output_dir):
    """
    Download the results of a completed compute-to-data job.
    
    :param dataset_did: DID of the dataset.
    :param job_id: The job ID of the compute job.
    :param output_dir: Directory where the results will be saved.
    :return: Path to the downloaded result file.
    """
    asset = ocean.assets.resolve(dataset_did)
    compute_service = asset.get_service(Service.SERVICE_COMPUTE)

    results = ocean.compute.result(wallet, asset, job_id, compute_service)

    # Download the results
    for result_file in results:
        file_url = result_file['url']
        file_name = result_file['file']
        file_path = os.path.join(output_dir, file_name)

        with open(file_path, 'wb') as file:
            response = requests.get(file_url)
            file.write(response.content)
        
        print(f"Result file downloaded to {file_path}")
    
    return file_path


def monitor_compute_job(dataset_did, job_id, check_interval=30):
    """
    Monitor a compute job until it is completed or fails.
    
    :param dataset_did: DID of the dataset.
    :param job_id: The job ID of the compute job.
    :param check_interval: Time interval (in seconds) between status checks.
    :return: Final status of the job.
    """
    status = check_job_status(dataset_did, job_id)
    
    while status in ['Running', 'Starting']:
        print(f"Job {job_id} is still {status}. Checking again in {check_interval} seconds...")
        time.sleep(check_interval)
        status = check_job_status(dataset_did, job_id)
    
    if status == 'Completed':
        print(f"Compute job {job_id} completed successfully.")
    else:
        print(f"Compute job {job_id} failed or was canceled with status: {status}")
    
    return status


if __name__ == "__main__":
    # Example usage:
    
    # Step 1: Start the compute job
    job_id = start_compute_job(DATASET_DID, ALGORITHM_DID)
    
    # Step 2: Monitor the job status until completion
    final_status = monitor_compute_job(DATASET_DID, job_id)
    
    # Step 3: Download the results if the job was successful
    if final_status == 'Completed':
        output_dir = './compute_results/'
        os.makedirs(output_dir, exist_ok=True)
        download_compute_results(DATASET_DID, job_id, output_dir)
