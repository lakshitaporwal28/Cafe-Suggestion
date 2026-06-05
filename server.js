const mongoURI = 'mongodb+srv://rishiporwal2004_db_user:h3fR6pMIfvFqUolY@cluster0.qcgylva.mongodb.net/Cafe?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`📂 Database: "${dbName}"`);
    console.log(`📋 Collections found:`, collectionNames);

    const count = await mongoose.connection.db.collection('Cafe').countDocuments();
    console.log(`📊 Documents actually inside "Cafe" collection: ${count}`);

    if (count === 0) {
      console.error('❌ ERROR: Database is empty');
    } else {
      console.log('✨ SUCCESS: Data is present');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
  });