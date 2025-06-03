require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gglink_db';

const communitiesToSeed = [
  { name: 'Comunidade Counter-Strike 2', game: 'Counter-Strike 2', description: 'O lar dos fãs de CS2! Encontre companheiros de equipe e discuta estratégias.' },
  { name: 'Comunidade League of Legends', game: 'League of Legends', description: 'Reúna-se com outros invocadores para subir de elo e dominar Summoner\'s Rift.' },
  { name: 'Comunidade Valorant', game: 'Valorant', description: 'Agentes, táticas e muita ação! Conecte-se com jogadores de Valorant.' },
];

async function seedCommunities() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado ao MongoDB para seeding!');

    for (const communityData of communitiesToSeed) {
      const existingCommunity = await Community.findOne({ game: communityData.game });
      if (!existingCommunity) {
        await Community.create(communityData);
        console.log(`Comunidade "${communityData.name}" criada.`);
      } else {
        console.log(`Comunidade "${communityData.name}" já existe, pulando.`);
      }
    }
    console.log('Seeding de comunidades concluído.');
  } catch (err) {
    console.error('Erro no seeding de comunidades:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedCommunities();