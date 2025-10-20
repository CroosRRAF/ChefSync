"""App-local shortcuts for Cloudinary helpers used in legacy tests."""
from utils.cloudinary_utils import (configure_cloudinary,  # noqa: F401
                                    delete_cloudinary_image,
                                    extract_public_id_from_url,
                                    get_optimized_url,
                                    migrate_blob_to_cloudinary,
                                    upload_image_to_cloudinary)
