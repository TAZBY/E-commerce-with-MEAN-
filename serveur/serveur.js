const express = require('express');
const { parse } = require('path');
const app     = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(function (req, res, next) {
    res.setHeader('Content-type','application/json')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

const MongoClient = require('mongodb').MongoClient;
const ObjectID    = require('mongodb').ObjectId;
const url         = "mongodb://localhost:27017";

MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    let db = client.db("SUPERVENTES");
    
    /* Liste des produits */
    app.get("/produits", (req,res) => {
        console.log("/produits");
        try {
            db.collection("produits").find().toArray((err, documents) => {
                res.end(JSON.stringify(documents));
            });
        } catch(e) {
            console.log("Erreur sur /produits : " + e);
            res.end(JSON.stringify([]));
        }
    });

    /* Liste des produits suivant une catégorie */
    app.get("/produits/:categorie", (req,res) => {
	let categorie = req.params.categorie;
        console.log("/produits/"+categorie);
        try {
            db.collection("produits").find({type:categorie}).toArray((err, documents) => {
                res.end(JSON.stringify(documents));
            });
        } catch(e) {
            console.log("Erreur sur /produits/"+categorie+" : "+ e);
            res.end(JSON.stringify([]));
        }
    });

    
    /* Liste des catégories de produits */
    app.get("/categories", (req,res) => {
        console.log("/categories");
	    categories = [];
        try {
            db.collection("produits").find().toArray((err, documents) => {
		    for (let doc of documents) {
                if (!categories.includes(doc.type)) categories.push(doc.type); 
		    }
            res.end(JSON.stringify(categories));
            });
        } catch(e) {
            console.log("Erreur sur /categories : " + e);
            res.end(JSON.stringify([]));
        }
    });

    /* Connexion */
    app.post("/membre/connexion", (req,res) => {
        try {
            db.collection("membres")
            .find(req.body)
            .toArray((err, documents) => {
                if (documents != undefined && documents.length == 1)
                    res.end(JSON.stringify({"resultat": 1, "message": "Authentification réussie"}));
                else res.end(JSON.stringify({"resultat": 0, "message": "Email et/ou mot de passe incorrect"}));
            });
        } catch (e) {
            res.end(JSON.stringify({"resultat": 0, "message": e}));
        }
    });

    app.post("/membre/inscription",(req,res) => {
        try{
            db.collection("membres")
            .find(req.body)
            .toArray((err, docs) => {
                if(docs != undefined && docs.length == 1){
                    res.end(JSON.stringify({"resultat" : 0, "message" : "cet utilisateur existe déjà !"}));
                }
                else{
                    db.collection("membres").insertOne(req.body);
                    res.end(JSON.stringify({"resultat" : 1, "message" : "Inscription réussie !"}));
    
                }
            });
        }
        catch (e) {
            res.end(JSON.stringify({"resultat": 0, "message": e}));
        }
    });

    app.post("/panier/ajout",(req,res) => {
        try{
            console.log(req.body.produit)
            db.collection("panier")
            .find(req.body)
            .toArray((err, docs) => {
                if(docs != undefined && docs.length == 1){
                     db.collection("panier").updateOne({"produit" : req.body.produit},{$inc:{"quantite" : 1}});
                     res.end(JSON.stringify({"resultat" : 1, "message" : "quantité mise à jour !"}));   
                }
                else{
                    db.collection("panier").insertOne(req.body);
                    res.end(JSON.stringify({"resultat" : 1, "message" : " produit ajouté au panier !"}));
                }
            });
        }
        catch (e) {
            res.end(JSON.stringify({"resultat": 0, "message": e}));
        }
    });

    app.post("/produits/recherche", (req, res) => {
        let search = req.body;
        console.log(search);
        try {
            if(search.nom == ""){
            db.collection("produits").find().toArray((err, documents) => {
                res.end(JSON.stringify(documents));
            });
        }else{
            db.collection("produits").find({ $or: [{nom: search.nom}, {type: search.nom}, {prix: parseInt(search.nom)}, {marque: search.nom}]}).toArray((err, documents) => {
                res.end(JSON.stringify(documents));
            });
        }
         }catch (e) {
            console.log("erreur lors de recherche du produit");
            res.end(JSON.stringify([]));
        }
    });

     /* Liste des produits du panier */
     app.get("/panier", (req,res) => {
        console.log("/panier");
        try {
            db.collection("panier").find().toArray((err, documents) => {
                res.end(JSON.stringify(documents));
            });
        } catch(e) {
            console.log("Erreur... : " + e);
            res.end(JSON.stringify([]));
        }
    });

     //Delete 
     app.post("/panier/supprimer", (req, res) => {

        console.log(req.body);
        try {
            db.collection("panier").deleteOne({produit: req.body.produit} , function(err, res) {
                console.log("produit supprimé");
                  
     
            });
        } catch(e) {
            console.log("Erreur suppression" + e);
            }
        //res.json(req.body);
        //res.end(JSON.stringify(user));
    });

    //Delete 
    app.get("/panier/vider", (req, res) => {

        console.log("vider....");
        try {
            db.collection("panier").drop()
             console.log("panier vidé !");
   

        } catch(e) {
            console.log("Erreur suppression" + e);
            }
        //res.json(req.body);
        //res.end(JSON.stringify(user));
    });

});

app.listen(8888);
