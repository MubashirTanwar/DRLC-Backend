import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, req.token + '-' + "ID/Declaration") // NEEDS TO BE UPDATED LATER
    }
  })
  
export const upload = multer({ storage: storage })