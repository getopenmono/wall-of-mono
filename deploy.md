# Deployment

The Docker container is built and started manually with

    $ docker build .
    $ docker run -d -p 7777:3000 [build_hash]

The Docker container is automatically built by [DockerHub](https://hub.docker.com/r/monolit/wall-of-mono/builds/) when you push to the Bitbucket repository.

To deploy on `private.openmono.com`, use

    $ export DOCKER_HOST=tcp://private.openmono.com:2375

Then update the autobuilt container:

    $ docker-compose pull
    $ docker-compose up -d

To see the logs

    $ docker-compose logs
