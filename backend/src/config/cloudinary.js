const cloudinary = require('cloudinary').v2;

let configured = false;

const configureCloudinary = () => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY    ||
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing in .env');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });

    configured = true;
    console.log('[Cloudinary] Configured successfully');
  } catch (err) {
    console.error('[Cloudinary] Configuration failed:', err.message);
    process.exit(1);
  }
};

const getCloudinary = () => {
  if (!configured) {
    configureCloudinary();
  }
  return cloudinary;
};

/**
 * Upload a file buffer or local path to Cloudinary
 * @param {string} fileSource  - local file path OR base64 data URI
 * @param {string} folder      - Cloudinary folder name e.g. 'posters', 'cast', 'tickets'
 * @param {string} publicId    - optional custom public_id (pass null to auto-generate)
 */
const uploadFile = async (fileSource, folder, publicId = null) => {
  try {
    const cloud = getCloudinary();

    const options = {
      folder,
      resource_type: 'auto',
      overwrite:     true,
      ...(publicId && { public_id: publicId }),
    };

    const result = await cloud.uploader.upload(fileSource, options);

    return {
      secure_url: result.secure_url,
      public_id:  result.public_id,
    };
  } catch (err) {
    console.error('[Cloudinary] Upload failed:', err.message);
    throw new Error('File upload failed — ' + err.message);
  }
};

/**
 * Delete a file from Cloudinary using its public_id
 * @param {string} publicId - the public_id stored in DB
 */
const deleteFile = async (publicId) => {
  try {
    if (!publicId) return;

    const cloud = getCloudinary();
    await cloud.uploader.destroy(publicId);
    console.log('[Cloudinary] Deleted:', publicId);
  } catch (err) {
    console.error('[Cloudinary] Delete failed:', err.message);
    throw new Error('File delete failed — ' + err.message);
  }
};

module.exports = { getCloudinary, uploadFile, deleteFile };
