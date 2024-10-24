import os
import json
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from ocean_lib.ocean.ocean import Ocean
from ocean_lib.config import Config
from ocean_lib.assets.asset import Asset
from ocean_lib.models.compute_input import ComputeInput
from ocean_lib.services.service import ServiceTypes
from dotenv import load_dotenv
from web3 import Web3

class SecureDataProcessor:
    def __init__(self, config_path: str = 'config.ini'):
        """Initialize the secure data processor with Ocean Protocol integration."""
        load_dotenv()
        
        # Initialize Ocean Protocol
        self.config = Config(config_path)
        self.ocean = Ocean(self.config)
        
        # Initialize encryption key
        self.encryption_key = os.getenv("ENCRYPTION_KEY")
        if not self.encryption_key:
            self.encryption_key = Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)
        
        # Web3 connection for Sapphire
        self.w3 = Web3(Web3.HTTPProvider(os.getenv("SAPPHIRE_RPC_URL")))

    async def process_dataset(
        self,
        asset_did: str,
        transformations: Dict[str, Any],
        encrypt_output: bool = True
    ) -> Dict[str, Any]:
        """
        Process a dataset with secure transformations and Ocean Protocol integration.
        
        Args:
            asset_did: Ocean Protocol dataset DID
            transformations: Dictionary of transformation parameters
            encrypt_output: Whether to encrypt the processed output
            
        Returns:
            Dictionary containing processed data info
        """
        try:
            # Download and verify dataset
            dataset = await self._secure_download(asset_did)
            
            # Apply transformations in secure environment
            processed_data = await self._apply_transformations(dataset, transformations)
            
            # Generate data hash
            data_hash = self._generate_hash(processed_data)
            
            # Encrypt if requested
            if encrypt_output:
                processed_data = self._encrypt_data(processed_data)
            
            # Upload to Ocean Protocol
            new_did = await self._upload_to_ocean(processed_data, {
                "preprocessed": True,
                "original_did": asset_did,
                "transformations": transformations,
                "data_hash": data_hash
            })
            
            return {
                "status": "success",
                "new_did": new_did,
                "data_hash": data_hash,
                "transformations_applied": transformations
            }
            
        except Exception as e:
            print(f"Error processing dataset: {str(e)}")
            raise

    async def _secure_download(self, asset_did: str) -> pd.DataFrame:
        """Securely download and verify dataset from Ocean Protocol."""
        try:
            # Resolve asset
            asset = self.ocean.assets.resolve(asset_did)
            if not asset:
                raise ValueError(f"Asset not found: {asset_did}")

            # Get download service
            service = asset.get_service(ServiceTypes.ASSET_ACCESS)
            if not service:
                raise ValueError("No access service available")

            # Download with integrity check
            file_path = await self.ocean.assets.download(
                asset,
                service.index,
                self.ocean.wallet,
                destination="./temp/"
            )

            # Verify integrity
            if not self._verify_integrity(file_path, asset.metadata):
                raise ValueError("Data integrity check failed")

            # Load into pandas
            return pd.read_csv(file_path)

        except Exception as e:
            print(f"Error downloading dataset: {str(e)}")
            raise

    async def _apply_transformations(
        self,
        data: pd.DataFrame,
        transformations: Dict[str, Any]
    ) -> pd.DataFrame:
        """Apply secure data transformations."""
        try:
            df = data.copy()

            # Handle missing values
            if transformations.get("handle_missing"):
                strategy = transformations["handle_missing"].get("strategy", "drop")
                if strategy == "drop":
                    df = df.dropna()
                elif strategy == "fill":
                    fill_value = transformations["handle_missing"].get("value", 0)
                    df = df.fillna(fill_value)

            # Normalization
            if transformations.get("normalize"):
                method = transformations["normalize"].get("method", "minmax")
                columns = transformations["normalize"].get("columns", df.select_dtypes(include=[np.number]).columns)
                
                if method == "minmax":
                    df[columns] = (df[columns] - df[columns].min()) / (df[columns].max() - df[columns].min())
                elif method == "zscore":
                    df[columns] = (df[columns] - df[columns].mean()) / df[columns].std()

            # Feature selection
            if transformations.get("select_features"):
                features = transformations["select_features"]
                df = df[features]

            # Custom transformations
            if transformations.get("custom"):
                df = self._apply_custom_transformations(df, transformations["custom"])

            return df

        except Exception as e:
            print(f"Error applying transformations: {str(e)}")
            raise

    def _apply_custom_transformations(
        self,
        data: pd.DataFrame,
        custom_transforms: Dict[str, Any]
    ) -> pd.DataFrame:
        """Apply custom data transformations."""
        df = data.copy()

        for transform in custom_transforms:
            if transform.get("type") == "categorical_encoding":
                columns = transform.get("columns", [])
                method = transform.get("method", "onehot")
                
                if method == "onehot":
                    df = pd.get_dummies(df, columns=columns)
                elif method == "label":
                    for col in columns:
                        df[col] = df[col].astype('category').cat.codes

            elif transform.get("type") == "aggregation":
                group_by = transform.get("group_by")
                agg_func = transform.get("function", "mean")
                df = df.groupby(group_by).agg(agg_func).reset_index()

        return df

    def _encrypt_data(self, data: pd.DataFrame) -> bytes:
        """Encrypt processed data using Fernet encryption."""
        try:
            data_bytes = data.to_json().encode()
            return self.fernet.encrypt(data_bytes)
        except Exception as e:
            print(f"Error encrypting data: {str(e)}")
            raise

    def _decrypt_data(self, encrypted_data: bytes) -> pd.DataFrame:
        """Decrypt processed data."""
        try:
            decrypted_bytes = self.fernet.decrypt(encrypted_data)
            return pd.read_json(decrypted_bytes.decode())
        except Exception as e:
            print(f"Error decrypting data: {str(e)}")
            raise

    def _generate_hash(self, data: pd.DataFrame) -> str:
        """Generate secure hash of processed data."""
        try:
            data_bytes = data.to_json().encode()
            return hashlib.sha3_256(data_bytes).hexdigest()
        except Exception as e:
            print(f"Error generating hash: {str(e)}")
            raise

    def _verify_integrity(self, file_path: str, metadata: Dict[str, Any]) -> bool:
        """Verify data integrity using stored hash."""
        try:
            with open(file_path, 'rb') as f:
                file_hash = hashlib.sha3_256(f.read()).hexdigest()
            return file_hash == metadata.get('contentHash')
        except Exception as e:
            print(f"Error verifying integrity: {str(e)}")
            raise

    async def _upload_to_ocean(
        self,
        data: pd.DataFrame,
        metadata: Dict[str, Any]
    ) -> str:
        """Upload processed data to Ocean Protocol."""
        try:
            # Prepare metadata
            asset_metadata = {
                "main": {
                    "name": f"Processed Dataset {metadata.get('original_did')}",
                    "type": "dataset",
                    "description": "Processed and transformed dataset",
                    "dateCreated": pd.Timestamp.now().isoformat(),
                    "author": "Confidential Data Exchange",
                    "license": "CC0: Public Domain",
                    "preprocessed": True,
                    "transformations": metadata.get("transformations"),
                    "contentHash": metadata.get("data_hash")
                }
            }

            # Save processed data temporarily
            temp_file = "./temp/processed_data.csv"
            data.to_csv(temp_file, index=False)

            # Create asset
            asset = await self.ocean.assets.create(
                temp_file,
                asset_metadata,
                self.ocean.wallet,
                encrypt=True
            )

            # Cleanup
            os.remove(temp_file)

            return asset.did

        except Exception as e:
            print(f"Error uploading to Ocean: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    # Initialize processor
    processor = SecureDataProcessor()

    # Example transformations
    transformations = {
        "handle_missing": {
            "strategy": "drop"
        },
        "normalize": {
            "method": "minmax",
            "columns": ["feature1", "feature2"]
        },
        "select_features": ["feature1", "feature2", "target"],
        "custom": [
            {
                "type": "categorical_encoding",
                "columns": ["category1"],
                "method": "onehot"
            }
        ]
    }

    import asyncio

    async def main():
        # Process dataset
        result = await processor.process_dataset(
            "did:op:example",
            transformations,
            encrypt_output=True
        )
        print(f"Processing complete: {result}")

    # Run the async main function
    asyncio.run(main())