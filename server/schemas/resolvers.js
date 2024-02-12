const { User } = require('./models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secret = 'mysecretsshhh'; // This should be in an environment variable
const expiration = '2h';

const resolvers = {
  Query: {
    // Get the current user
    me: async (_, args, context) => {
      if (context.user) {
        return User.findById(context.user._id);
      }
      throw new Error('You need to be logged in!');
    },
  },
  Mutation: {
    // Login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('No user with this email found!');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new Error('Incorrect password!');
      }

      const token = jwt.sign({ email, _id: user._id }, secret, { expiresIn: expiration });

      return { token, user };
    },
    // Create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
    addUser: async (_, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = jwt.sign({ email, _id: user._id }, secret, { expiresIn: expiration });

      return { token, user };
    },
    // Save a book to a user's `savedBooks` array by adding it to the set (to prevent duplicates)
    saveBook: async (_, { bookData }, context) => {
      if (context.user) {
        return User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        );
      }
      throw new Error('You need to be logged in!');
    },
    // Remove a book from `savedBooks`
    removeBook: async (_, { bookId }, context) => {
      if (context.user) {
        return User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
      }
      throw new Error('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
