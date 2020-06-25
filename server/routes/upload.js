const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const {once} = require('events');
const desofuscador = require('../desofuscador');

//verifica o formato de arquivo enviado
const upload = multer({
    dest: 'upload_files/',
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(txt|log)$/)) {
            return cb(new Error('Formato de arquivo inválido.'));
        }
        cb(null, true);
    }
}).single('arquivo');

//se houver um erro o status é 442, senao o arquivo é processado e é feito o download
// de um arquivo com o mesmo nome do enviado
router.post('/', (req, res) => {
    upload(req, res, async (err) =>{
        if (err) {
            console.log(err);
            res.status(422).send();
        } else {
            let file = req.file;
            const path = await processFile(file);
            if (path) {
                res.download(path,file.originalname);
            } else {
                res.status(500).send();
            }
        }
    });
});

//funcao processa o arquivo, lendo linha a linha,
// chamando a função do desofuscador e escrevendo o arquivo de saída
async function processFile(file) {
    const outpath = `${process.env.OUTDIR}/${file.filename}`;
    const writeStream = fs.createWriteStream(outpath, {
        flags: 'a'
    });
    writeStream.on('error', (err) => {
        consol.log(err);
        throw err;
    })

    const readInterface = readline.createInterface({
        input: fs.createReadStream(file.path)
    })
    readInterface.on('line', (line) =>{
        writeStream.write(`${desofuscador.decode(line)}\n`);
    })
    readInterface.on('close', () => {
        writeStream.end();
    });

    await once(writeStream, 'finish');

    return outpath;
}

module.exports = router;