const formidable = require("formidable")
const Product = require("../models/product")
const _ = require("lodash")
const fs = require("fs")
const product = require("../models/product")

exports.getProductById = (req, res, next, id) => {
    Product.findById(id)
    .populate("category")
    .exec((err, product) => {
        if(err){
            return res.status(400).json({
                error : "Product Not Found"
            })
        }
        req.product = product
        next()
    })
}

exports.createProduct = (req, res) => {
    let form = formidable.IncomingForm()
    form.keepExtensions = true

    form.parse(req, (err, fields, file) => {
        
        if (err) {
            return res.status(400).json({
              error: "problem with image"
            });
          }
    //destructure the fields

    const { name, description, price, category, stock } = fields;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        error: "Please include all fields"
      });
    }
        
    let product = new Product(fields)  //fields from 24

        //handle file here
        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                    error : "File is TOO big to save in DB"
                })
            }

            product.photo.data = fs.readFileSync(file.photo.path)
            product.photo.contentType = file.photo.type
        }

        //save in DB
        product.save((err, product) => {
            if (err){
                res.status(400).json({
                    error: "UNABLE TO SAVE PRODUCT IN DB"
                })
            }
            
            res.json(product)
        })
    })
}

exports.getProduct = (req, res) => {
    req.product.photo = undefined
    return res.json(req.product)
}

//Middle ware for optimzation
exports.photo = (req, res, next) => {
    if(req.product.photo.data){
        res.set("Content-Type", req.product.photo.contentType)
        return res.send(req.product.photo.data)
    }

    next()
} 

// delete controller
exports.deleteProduct = (req, res) => {
    let product = req.product
    product.remove((err, deletedProduct) => {
        if (err){
            return res.status(400).json({
                message : "Unable to delete product"
            })
        }
        res.json({
            message : "Product delected Successfully",
            deletedProduct
        })
    })
}

//update controller
exports.updateProduct = (req, res) => {
    let form = formidable.IncomingForm()
    form.keepExtensions = true

    form.parse(req, (err, fields, file) => {
        
        if (err) {
            return res.status(400).json({
              error: "problem with image"
            });
          }
    
    //update code logic
    let product = req.product
    product = _.extend(product, fields)

        //handle file here
        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                    error : "File is TOO big to save in DB"
                })
            }

            product.photo.data = fs.readFileSync(file.photo.path)
            product.photo.contentType = file.photo.type
        }

        //save in DB
        product.save((err, product) => {
            if (err){
                res.status(400).json({
                    error: "UNABLE TO update PRODUCT IN DB"
                })
            }
            
            res.json(product)
        })
    })
}

//listing of products
exports.getAllProducts = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
        if (err){
            return res.status(400).json({
                error : "Unable to get All Products "
            })
        }
        res.json(products)
    })
}

//unique category
exports.getAllUniqueCategories = (req, res) => {
    Product.distinct("category", {}, (err, category) => {
      if (err) {
        return res.status(400).json({
          error: "NO category found"
        });
      }
      res.json(category);
    });
};

//stock & sold middleware
exports.updateStock = (req, res, next) => {
    let myOperations = req.body.order.products.map(prod => {
        return {
          updateOne: {
            filter: { _id: prod._id },
            update: { $inc: { stock: -prod.count, sold: +prod.count } }
          }
        };
      });
    
      Product.bulkWrite(myOperations, {}, (err, products) => {
        if (err) {
          return res.status(400).json({
            error: "Bulk operation failed"
          });
        }
        next();
      });
}