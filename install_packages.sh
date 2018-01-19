if [ "$EUID" -ne 0 ]
    then echo "Permission denied. Please run as root"
    exit
fi

apt-get install nodejs build-essential
apt install node-express-generator mongodb
npm install -g npm@latest
npm install
