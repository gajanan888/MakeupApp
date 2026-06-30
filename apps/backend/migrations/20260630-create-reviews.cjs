"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Reviews", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      artistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rating: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint("Reviews", {
      fields: ["bookingId"],
      type: "foreign key",
      name: "fk_reviews_booking",
      references: { table: "Bookings", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Reviews", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_reviews_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Reviews", {
      fields: ["customerId"],
      type: "foreign key",
      name: "fk_reviews_customer",
      references: { table: "Customers", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addIndex("Reviews", ["bookingId"]);
    await queryInterface.addIndex("Reviews", ["artistId"]);
    await queryInterface.addIndex("Reviews", ["customerId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Reviews");
  },
};
