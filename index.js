const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
mongoose.connect('mongodb://localhost:27017/assignment2quest1')
.then(()=>{
console.log('Mongo connected successfully.');
})
.catch((err)=>{
console.log(`Error : ${err}`);
})
const filesSchema = new mongoose.Schema({
name: {
type: String,
required: true
},
email: {
type: String,
required: true
},
password: {
type: String,
required: true
},
aadhar: {
type: String,
required: true
}
});
const documentSchema = new mongoose.Schema({
fileId: {
required: true,
type : mongoose.Types.ObjectId,
ref: 'files'
},
name: {
required: true,
type: String
}
})
const File = new mongoose.model('files', filesSchema);
const Document = new mongoose.model('docs', documentSchema);
const storage = multer.diskStorage({
destination: (req, file, cb)=>{
try {
if(file.mimetype !== 'application/pdf')
{
cb('Only pdf file is supported');
}
else
{
cb(null, './uploads');
}
} catch (error) {
cb(error)
}
},
filename: (req, file, cb)=>{
try {
cb(null, Date.now() + "-" + file.originalname);
} catch (error) {
cb(error)
}
}
});
const uploads = multer({storage})
const app = express();
app.get('/', (req, res)=>{
try {
return res.sendFile(path.join(__dirname, 'form.html'));
} catch (error) {
console.log(error);
return res.status(500).json(error);
}
});
app.get('/documents', (req, res)=>{
try {
return res.sendFile(path.join(__dirname, 'documents.html'));
} catch (error) {
return res.status(500).json({error});
}
})
app.get('/docs', (req, res)=>{
return res.sendFile(path.join(__dirname, 'download.html'));
})
app.get('/files', async(req, res)=>{
try {
const files = await File.aggregate([
{
$lookup: {
from: 'docs',
localField: '_id',
foreignField: 'fileId',
as: 'doc'
}
}
]);
return res.status(200).json(files)
} catch (error) {
return res.status(500).json({error});
}
});
app.post('/register', uploads.single('aadhar'), async (req, res)=>{
const {name, email, password} = req.body;
const aadhar = req.file.filename;
const newUser = new File({name: name, email: email, password: password, aadhar: aadhar});
await newUser.save();
return res.redirect('/documents?id=' + newUser._id);
})
app.post('/document-uploads', uploads.array('docs'), async(req, res)=>{
try {
const id = req.body.id;
const files = req.files;
const docs = files.map(file => {
return {
fileId: new mongoose.Types.ObjectId(id),
name: file.filename
}
});
await Document.insertMany(docs);
return res.redirect('/docs')
} catch (error) {
console.log(error);
return res.status(500).json({error});
}
});
app.listen(5000)