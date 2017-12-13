"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

const should = chai.should();

const { BlogPost } = require("../models");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

function seedPostData() {
  console.info("seeding blog post data");
  const seedData = [];

  for (let i = 1; i <= 10; i++) {
    seedData.push(generatePostData());
  }

  return BlogPost.insertMany(seedData);
}

function generatePostData() {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }
  };
}

function tearDownDb() {
  console.warn("Deleting database");
  return mongoose.connection.dropDatabase();
}

describe("Blog Post API resource", function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe("GET endpoint", function() {
    it("Should return all existing blog posts", function() {
      let res;
      return chai
        .request(app)
        .get("/posts")
        .then(function(_res) {
          res = _res;
          res.should.have.status(200);
          res.body.should.have.length.of.at.least(1);
          return BlogPost.count();
        });
      then(function(count) {
        res.body.should.have.length.of.at.least(count);
      });
    });

    it("Should return blog posts with the right fields", function() {
      let resPost;
      return chai
        .request(app)
        .get("/posts")
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a("array");
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(post) {
            post.should.be.a("object");
            post.should.include.keys(
              "id",
              "title",
              "content",
              "author",
              "created"
            );
          });
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {
          resPost.id.should.equal(post.id),
            resPost.title.should.equal(post.title),
            resPost.content.should.equal(post.content),
            resPost.author.should.equal(post.authorName);
        });
    });
  });

  describe("POST endpoint", function() {
    it("Should add a new blog post", function() {
      const newPost = generatePostData();

      return chai
        .request(app)
        .post("/posts")
        .send(newPost)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a("object");
          res.body.should.include.keys(
            "id",
            "title",
            "content",
            "author",
            "created"
          );
          res.body.id.should.not.be.null;
          res.body.title.should.equal(newPost.title);
          res.body.content.should.equal(newPost.content);
          res.body.author.should.equal(
            `${newPost.author.firstName} ${newPost.author.lastName}`
          );
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });

  describe("PUT endpoint", function() {
    it("Should update fields you send over", function() {
      const updatedData = {
        title: "Updated title",
        content: "New content",
        author: {
          firstName: "John",
          lastName: "Doe"
        }
      };

      return BlogPost.findOne()
        .then(function(post) {
          updatedData.id = post.id;

          return chai
            .request(app)
            .put(`/posts/${post.id}`)
            .send(updatedData);
        })
        .then(function(res) {
          res.should.have.status(204);

          return BlogPost.findById(updatedData.id);
        })
        .then(function(post) {
          post.title.should.equal(post.title);
          post.content.should.equal(post.content);
          post.author.firstName.should.equal(post.author.firstName);
          post.author.lastName.should.equal(post.author.lastName);
        });
    });
  });

  describe("DELETE endpoint", function() {
    it("Should delete a blog post by id", function() {
      let post;

      return BlogPost.findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(function(_post) {
          should.not.exist(_post);
        });
    });
  });
});
