const { EntitySchema } = require('typeorm');

/**
 * @ApiEntity("用户")
 */
module.exports = new EntitySchema({
    name: 'User',
    tableName: 'user',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        name: {
            type: 'varchar',
            length: 400,
        },
        age: {
            type: 'int',
            default: 0,
        },
        email: {
            type: 'varchar',
            length: 100,
            unique: true,
        },
        birthDate: {
            type: 'date',
            name: 'birth_date',
            default: () => 'CURRENT_DATE',
        },
        createdAt: {
            type: 'timestamptz',
            name: 'created_at',
            createDate: true,
        },
        updatedAt: {
            type: 'timestamptz',
            name: 'updated_at',
            updateDate: true,
        },
    },
});
