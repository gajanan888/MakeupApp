import express from "express";
import multer from "multer";
import { uploadFileController } from "./upload.controller.js";

const router = express.Router();

const storage = multer.memoryStorage();

// file size limit 2MB and filter allowed types
const upload = multer({
	storage,
	limits: { fileSize: 2 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const { mimetype } = file;
		if (mimetype.startsWith('image/')) return cb(null, true);
		const allowed = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		];
		if (allowed.includes(mimetype)) return cb(null, true);
		return cb(new Error('Invalid file type'), false);
	},
});

// Wrap multer so we can handle multer errors and return friendly messages
router.post('/', (req, res) => {
	upload.single('file')(req, res, async (err) => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') {
				return res.status(400).json({ success: false, message: 'File must be under 2MB.' });
			}
			return res.status(400).json({ success: false, message: err.message || 'File upload error' });
		}

		return uploadFileController(req, res);
	});
});

export default router;
