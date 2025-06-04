require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gglink_db';

const communitiesToSeed = [
  { name: 'Comunidade Counter-Strike 2', game: 'Counter-Strike 2', description: 'O lar dos fãs de CS2! Encontre companheiros de equipe e discuta estratégias.',imageUrl: 'https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg'},
  { name: 'Comunidade League of Legends', game: 'League of Legends', description: 'Reúna-se com outros invocadores para subir de elo e dominar Summoner\'s Rift.',imageUrl: 'https://s2.glbimg.com/UQC8wD2YVhUPqgaYUhhCVqwU2Pg=/0x0:1280x720/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2019/Y/L/lIgTd8SVCHPu8lGXmbJg/novo-logo-league-of-legends.jpg'},
  { name: 'Comunidade Valorant', game: 'Valorant', description: 'Agentes, táticas e muita ação! Conecte-se com jogadores de Valorant.', imageUrl: 'https://www.riotgames.com/darkroom/1440/8d5c497da1c2eeec8cffa99b01abc64b:5329ca773963a5b739e98e715957ab39/ps-f2p-val-console-launch-16x9.jpg'},
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