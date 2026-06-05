const mongoURI = 'mongodb+srv://rishiporwal2004_db_user:h3fR6pMIfvFqUolY@cluster0.qcgylva.mongodb.net/Cafe?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = mongoose.connection.name;
    console.log(`📂 Database: ${dbName}`);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
  });