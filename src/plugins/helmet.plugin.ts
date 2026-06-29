import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

async function helmetPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });
}

export default fp(helmetPlugin, {
  name: 'helmet-plugin',
  fastify: '5.x',
});
