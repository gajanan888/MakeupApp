"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Messages", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      artistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sender: {
        type: Sequelize.ENUM("artist", "client"),
        allowNull: false,
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      time: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addConstraint("Messages", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_messages_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Messages", {
      fields: ["customerId"],
      type: "foreign key",
      name: "fk_messages_customer",
      references: { table: "Customers", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addIndex("Messages", ["artistId"]);
    await queryInterface.addIndex("Messages", ["customerId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Messages");
  },
};
