"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = [
      "Bookings",
      "Customers",
      "Artists",
      "ArtistProfiles",
      "ArtistServices",
      "ArtistPortfolios",
      "ArtistPayments",
      "ArtistCertificates",
      "ArtistSpecializations",
      "ArtistBlocks",
      "Reviews",
      "Messages",
      "Wishlists",
      "CallLogs",
      "ActivityLogs",
      "Admins",
    ];

    // 1. Add soft-delete `deletedAt` column to all tables
    for (const table of tables) {
      try {
        await queryInterface.addColumn(table, "deletedAt", {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        });
      } catch (e) {
        // Column may already exist
      }
    }

    // 2. Create SQL trigger to block HARD DELETES on PostgreSQL if applicable
    try {
      const dial = queryInterface.sequelize.getDialect();
      if (dial === "postgres") {
        await queryInterface.sequelize.query(`
          CREATE OR REPLACE FUNCTION prevent_table_deletion()
          RETURNS TRIGGER AS $$
          BEGIN
              RAISE EXCEPTION 'Hard deletion of records from table % is blocked by security policy. Use soft-delete (deletedAt) instead.', TG_TABLE_NAME;
          END;
          $$ LANGUAGE plpgsql;
        `);

        const protectedTables = ["Bookings", "Customers", "Artists", "Reviews", "Messages"];
        for (const pTable of protectedTables) {
          try {
            await queryInterface.sequelize.query(`
              DROP TRIGGER IF EXISTS trg_prevent_delete_${pTable.toLowerCase()} ON "${pTable}";
              CREATE TRIGGER trg_prevent_delete_${pTable.toLowerCase()}
              BEFORE DELETE ON "${pTable}"
              FOR EACH ROW
              EXECUTE FUNCTION prevent_table_deletion();
            `);
          } catch (trgErr) {
            console.warn(`Trigger creation notice for ${pTable}:`, trgErr.message);
          }
        }
      }
    } catch (err) {
      console.warn("SQL Trigger setup notice:", err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      "Bookings",
      "Customers",
      "Artists",
      "ArtistProfiles",
      "ArtistServices",
      "ArtistPortfolios",
      "ArtistPayments",
      "ArtistCertificates",
      "ArtistSpecializations",
      "ArtistBlocks",
      "Reviews",
      "Messages",
      "Wishlists",
      "CallLogs",
      "ActivityLogs",
      "Admins",
    ];

    for (const table of tables) {
      try {
        await queryInterface.removeColumn(table, "deletedAt");
      } catch (e) {}
    }
  },
};
