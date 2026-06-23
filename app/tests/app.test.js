const request = require('supertest');
const app = require('../app'); // Puxa o nosso simulador de Delivery

describe('Testes da API de Delivery', () => {
    
    // Teste 1: Verifica se a aplicação está viva (Exigência do Render)
    it('Deve retornar status 200 na rota de Health Check', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('UP');
    });

    // Teste 2: Verifica se a criação de pedido está funcionando
    it('Deve retornar status 201 ao criar um Novo Pedido', async () => {
        const response = await request(app).post('/pedido/novo');
        expect(response.statusCode).toBe(201);
    });

    // Teste 3: Verifica se o cancelamento de pedido aciona o erro correto (400)
    it('Deve retornar status 400 ao Cancelar um Pedido', async () => {
        const response = await request(app).post('/pedido/cancelado');
        expect(response.statusCode).toBe(400);
    });
});