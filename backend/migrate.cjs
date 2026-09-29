const mysql = require('mysql2/promise');
mysql.createConnection('mysql://root:@localhost:3306/faturacao').then(c => {
  c.query('ALTER TABLE invoice_series MODIFY COLUMN documentType enum("FT","FR","FS","FA","NC","ND","RC","RG","OR","PP","FP","CM") NOT NULL')
    .then(() => c.query('ALTER TABLE invoices MODIFY COLUMN documentType enum("FT","FR","FS","FA","NC","ND","RC","RG","OR","PP","FP","CM") NOT NULL'))
    .then(() => c.query('ALTER TABLE invoices ADD cancelReason varchar(255)'))
    .catch(() => console.log('cancelReason may already exist'))
    .then(() => c.query('ALTER TABLE invoices ADD rectificationType enum("anulacao_total","rectificacao_parcial")'))
    .catch(() => console.log('rectificationType may already exist'))
    .then(() => console.log("done"))
    .catch(console.error)
    .finally(() => process.exit());
});
