git clone --bare https://github.com/pouc/my-node-template.git
cd my-node-template.git
echo repo_token: change-me > .coveralls.yml
git push --mirror https://github.com/pouc/***.git
cd ..
rmdir /s /q my-node-template.git