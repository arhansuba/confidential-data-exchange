# offchain/data_processing.py

import os
import json
import requests
import hashlib
from ocean_lib.ocean.ocean import Ocean
from ocean_lib.config import Config
from ocean_lib.assets.asset import Asset
from ocean_lib.models.compute_input import ComputeInput
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Global settings
OCEAN_RPC_URL = os.getenv("OCEAN_RPC_URL")
OCEAN_WALLET_ADDRESS = os.getenv("OCEAN_WALLET_ADDRESS")
DATASET_DID = os.getenv("DATASET_DID")  # DID of the dataset from Ocean Protocol

# Initialize Ocean Protocol client
config = Config('config.ini')  # Adjust with your Ocean config file path
ocean = Ocean(config)


def get_dataset(asset_did):
    """
    Retrieve the dataset details from Ocean Protocol using its DID.
    
    :param asset_did: DID of the dataset stored on Ocean Protocol.
    :return: Asset object containing dataset details.
    """
    asset = ocean.assets.resolve(asset_did)
    return asset


def download_dataset(asset_did):
    """
    Download the dataset from Ocean Protocol and save it locally for preprocessing.
    
    :param asset_did: DID of the dataset.
    :return: Path to the downloaded dataset file.
    """
    asset = get_dataset(asset_did)
    
    # Get the first service that supports 'access' (this is the download service)
    access_service = None
    for service in asset.services:
        if service.type == 'access':
            access_service = service
            break

    if not access_service:
        raise ValueError(f"Dataset {asset_did} does not support access/download services.")

    # Download the dataset file
    file_url = ocean.assets.download(asset, ocean.wallet)
    dataset_file = f"dataset_{asset_did}.csv"  # Adjust extension based on file type
    with open(dataset_file, 'wb') as file:
        response = requests.get(file_url)
        file.write(response.content)
    
    print(f"Dataset downloaded to {dataset_file}")
    return dataset_file


def preprocess_dataset(dataset_file, transformations):
    """
    Preprocess the dataset by applying transformations (e.g., normalization, cleaning).
    
    :param dataset_file: Path to the dataset file.
    :param transformations: Dictionary specifying preprocessing steps.
    :return: Path to the preprocessed dataset file.
    """
    # Example: You can add more complex preprocessing steps based on transformations
    with open(dataset_file, 'r') as file:
        data = file.read()  # Reading the raw data; adjust this based on file format (e.g., CSV, JSON)
    
    # Apply transformations (e.g., normalization, cleaning)
    if transformations.get('normalize'):
        # Add normalization logic here, like Min-Max scaling
        data = normalize_data(data)
    
    if transformations.get('remove_nulls'):
        # Add logic to remove or handle missing data
        data = remove_nulls(data)

    # Save the preprocessed dataset
    preprocessed_file = f"preprocessed_{dataset_file}"
    with open(preprocessed_file, 'w') as file:
        file.write(data)

    print(f"Dataset preprocessed and saved to {preprocessed_file}")
    return preprocessed_file


def normalize_data(data):
    """
    Normalize the dataset (placeholder function).
    
    :param data: Raw dataset.
    :return: Normalized dataset.
    """
    # Example normalization logic
    normalized_data = data  # Placeholder, replace with actual logic
    print("Data normalization applied.")
    return normalized_data


def remove_nulls(data):
    """
    Remove or handle missing/null data (placeholder function).
    
    :param data: Raw dataset.
    :return: Dataset with nulls removed or handled.
    """
    # Example logic to remove nulls
    cleaned_data = data  # Placeholder, replace with actual logic
    print("Null values removed from data.")
    return cleaned_data


def hash_preprocessed_data(preprocessed_file):
    """
    Generate a cryptographic hash of the preprocessed data for integrity verification.
    
    :param preprocessed_file: Path to the preprocessed dataset file.
    :return: Hash of the preprocessed data.
    """
    hash_md5 = hashlib.md5()
    with open(preprocessed_file, 'rb') as file:
        for chunk in iter(lambda: file.read(4096), b""):
            hash_md5.update(chunk)
    
    data_hash = hash_md5.hexdigest()
    print(f"Generated hash for preprocessed dataset: {data_hash}")
    return data_hash


def upload_preprocessed_data_to_ocean(preprocessed_file):
    """
    Upload the preprocessed dataset to Ocean Protocol as a new asset.
    
    :param preprocessed_file: Path to the preprocessed dataset file.
    :return: DID of the newly uploaded dataset.
    """
    metadata = {
        "main": {
            "name": f"Preprocessed Dataset {os.path.basename(preprocessed_file)}",
            "type": "dataset",
            "dateCreated": "2024-10-22T00:00:00Z",  # Replace with current date/time
            "author": "Confidential Data Exchange",
            "license": "CC0: Public Domain",
        }
    }

    # Upload the preprocessed dataset as a new asset on Ocean
    asset = ocean.assets.create(preprocessed_file, metadata, ocean.wallet)
    
    if asset:
        print(f"Preprocessed dataset uploaded with DID: {asset.did}")
        return asset.did
    else:
        print("Failed to upload preprocessed dataset.")
        return None


if __name__ == "__main__":
    # Example usage:
    
    # Step 1: Download the dataset from Ocean Protocol
    dataset_file = download_dataset(DATASET_DID)
    
    # Step 2: Preprocess the dataset (example transformations: normalize, remove nulls)
    transformations = {"normalize": True, "remove_nulls": True}
    preprocessed_file = preprocess_dataset(dataset_file, transformations)
    
    # Step 3: Generate a hash of the preprocessed data for integrity verification
    data_hash = hash_preprocessed_data(preprocessed_file)
    
    # Step 4: Upload the preprocessed data back to Ocean as a new asset
    new_dataset_did = upload_preprocessed_data_to_ocean(preprocessed_file)
