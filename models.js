"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const blogPostSchema = mongoose.Schema({
  title: { type: String, required: true },
  author: { firstName: String, lastName: String },
  content: { type: String },
  created: { type: Date, default: Date.now }
});

blogPostSchema.virtual("authorName").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    author: this.authorName,
    content: this.content,
    created: this.created
  };
};

const BlogPost = mongoose.model("Post", blogPostSchema);

module.exports = { BlogPost };
