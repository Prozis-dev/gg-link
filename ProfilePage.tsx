import './ProfilePage.css';
import logo from '../assets/logo.svg';
import bckImage from '../assets/DEGRADE + IMAGEM.png';


type ProfilePageProps={
    username:string;
    photo:string;
    joined:string;
    friends:number;
}

const ProfilePage=({username,photo,joined,friends}: ProfilePageProps)=>{
    return(
        <div className="page-container" style={{ backgroundImage: `url(${bckImage})`, backgroundSize: 'cover' }}>
        <header className="topbar">
            <img src={logo} alt="Logo" className="profile-logo"/>
            <button className="communities-btn">Comunidades</button>
            <div className="user-info">
                <span>{username}</span>
                <img src={photo} alt="User avatar" className="user-avatar"/>
            </div>
        </header>
        <div className="profile-container">
            <div className="profile-card" style={{ position: "relative" }}>
                <div className="profile-header">
                    <span className="profile-title">Conta</span>
                    <button className="close-button">✕</button>
                </div>
                <div className="profile-body">
                    <div className="profile-sidebar">
                    <ul className="menu-list">
                        <li className="active">Perfil</li>
                        <li>Badges</li>
                        <li>Mudar senha</li>
                        <li>Mudar e-mail</li>
                        <li>Configurações do GG</li>
                        <li>Patreon</li>
                        <li>Sobre o uso</li>
                        <li>Bugs e Feedback</li>
                        <li>Logout</li>
                    </ul>
                </div>
                <div className="profile-content">
                    <h2>{username}</h2>
                    <img src={photo} alt="Profile picture" className="profile-image"/>
                    <div className="profile-info">
                        <p><strong>Entrou em:</strong></p>
                        <p>{joined}</p>
                        <p className="friends"><strong>Amigos:</strong>{friends}</p>

                </div>
                </div>
                
            </div>
        </div>
        </div>
        </div>
        
    );
};
export default ProfilePage;