import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781101536668 implements MigrationInterface {
    name = 'InitialSchema1781101536668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`usuarios\` (\`id\` varchar(36) NOT NULL, \`nomeUsuario\` varchar(50) NOT NULL, \`senha\` varchar(255) NOT NULL, \`nome\` varchar(120) NOT NULL, \`nivel\` enum ('ADMIN', 'GESTOR', 'TECNICO') NOT NULL DEFAULT 'TECNICO', \`email\` varchar(120) NULL, \`recuperacaoToken\` varchar(255) NULL, \`recuperacaoExpiracao\` datetime NULL, \`tokenVersion\` int NOT NULL DEFAULT '0', \`primeiroAcesso\` tinyint NOT NULL DEFAULT 1, \`criadoPor\` varchar(120) NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_007538d8a5c491d5639681d116\` (\`nomeUsuario\`), UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`componentes\` (\`id\` varchar(36) NOT NULL, \`nome\` varchar(120) NOT NULL, \`tipo\` varchar(80) NOT NULL, \`vidaUtilNominal\` float NOT NULL, \`horasOperacionais\` float NOT NULL DEFAULT '0', \`equipamentoId\` varchar(255) NOT NULL, \`modificado\` tinyint NOT NULL DEFAULT 0, \`status\` varchar(50) NOT NULL DEFAULT 'Saudável', \`custoUnitario\` float NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`diagnosticos_historico\` (\`id\` varchar(36) NOT NULL, \`severidadeAnterior\` enum ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL, \`textoAnterior\` text NOT NULL, \`dataEdicao\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`diagnosticoId\` varchar(36) NULL, \`editorId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`diagnosticos\` (\`id\` varchar(36) NOT NULL, \`data\` date NOT NULL, \`severidade\` enum ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'BAIXA', \`texto\` text NOT NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`equipamentoId\` varchar(36) NULL, \`autorId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`equipamentos\` (\`id\` varchar(36) NOT NULL, \`nome\` varchar(150) NOT NULL, \`tag\` varchar(50) NOT NULL, \`tipo\` varchar(100) NOT NULL, \`fabricante\` varchar(120) NOT NULL, \`modelo\` varchar(120) NOT NULL, \`numeroSerie\` varchar(100) NULL, \`localizacao\` varchar(200) NOT NULL, \`status\` enum ('OPERANDO', 'PARADO', 'MANUTENCAO') NOT NULL DEFAULT 'OPERANDO', \`dataInstalacao\` date NULL, \`descricao\` text NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_78734bbc9a45888ad5d7c1ca96\` (\`tag\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`solicitacoes_modificacao\` (\`id\` varchar(36) NOT NULL, \`equipamentoId\` varchar(255) NOT NULL, \`tipoModificacao\` enum ('ADICAO', 'SUBSTITUICAO_TECNOLOGIA', 'REMOCAO') NOT NULL, \`justificativa\` text NOT NULL, \`componenteSaidaId\` varchar(255) NULL, \`componenteEntradaId\` varchar(255) NULL, \`novoComponenteNome\` varchar(120) NULL, \`novoComponenteTipo\` varchar(80) NULL, \`novoComponenteVidaUtilNominal\` float NULL, \`parecerEngenharia\` text NULL, \`status\` enum ('PENDENTE', 'EM_IMPLEMENTACAO', 'CONCLUIDO') NOT NULL DEFAULT 'PENDENTE', \`dataImplementacao\` datetime NULL, \`solicitanteId\` varchar(255) NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reportes_substituicao\` (\`id\` varchar(36) NOT NULL, \`pecaInstalada\` varchar(200) NOT NULL, \`vidaUtilNovaPeca\` float NOT NULL, \`dataSubstituicao\` date NOT NULL, \`motivo\` enum ('PREVENTIVA', 'CORRETIVA', 'PREDITIVA', 'DESGASTE_NATURAL') NOT NULL DEFAULT 'CORRETIVA', \`fabricanteNovaPeca\` varchar(120) NULL, \`observacoes\` text NULL, \`status\` enum ('AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'AGUARDANDO_APROVACAO', \`motivoRejeicao\` text NULL, \`componenteId\` varchar(255) NOT NULL, \`equipamentoId\` varchar(255) NOT NULL, \`tecnicoId\` varchar(255) NULL, \`aprovadorId\` varchar(255) NULL, \`decididoEm\` datetime NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ordens_manutencao\` (\`id\` varchar(36) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`descricao\` text NOT NULL, \`tipo\` enum ('PREVENTIVA', 'CORRETIVA_PROGRAMADA', 'CORRETIVA_EMERGENCIAL', 'PREDITIVA') NOT NULL, \`prioridade\` enum ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA', \`status\` enum ('ABERTA', 'AGUARDANDO_INICIO', 'EM_EXECUCAO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'ABERTA', \`dataInicioPrevisto\` datetime NULL, \`materiaisNecessarios\` json NULL, \`anexos\` json NULL, \`observacoes\` text NULL, \`tempoEstimado\` float NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`atualizadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`equipamentoId\` varchar(36) NOT NULL, \`solicitanteId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_70ee6d8e10327c404d8ede2118\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`equipamento_auditoria\` (\`id\` varchar(36) NOT NULL, \`equipamentoId\` varchar(255) NOT NULL, \`usuarioId\` varchar(255) NULL, \`statusAnterior\` enum ('OPERANDO', 'PARADO', 'MANUTENCAO') NOT NULL, \`statusNovo\` enum ('OPERANDO', 'PARADO', 'MANUTENCAO') NOT NULL, \`detalhes\` varchar(255) NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`alertas\` (\`id\` varchar(36) NOT NULL, \`mensagem\` text NOT NULL, \`tipo\` varchar(50) NOT NULL, \`lido\` tinyint NOT NULL DEFAULT 0, \`componenteId\` varchar(255) NOT NULL, \`criadoEm\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`om_tecnicos\` (\`om_id\` varchar(36) NOT NULL, \`tecnico_id\` varchar(36) NOT NULL, INDEX \`IDX_bcb6db50ff6561f813f432113d\` (\`om_id\`), INDEX \`IDX_184b22a3f1b62283598de6b0a3\` (\`tecnico_id\`), PRIMARY KEY (\`om_id\`, \`tecnico_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`componentes\` ADD CONSTRAINT \`FK_94285c1d4d6b31288972d57d514\` FOREIGN KEY (\`equipamentoId\`) REFERENCES \`equipamentos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diagnosticos_historico\` ADD CONSTRAINT \`FK_34f8f857b540fda1f939620b72b\` FOREIGN KEY (\`diagnosticoId\`) REFERENCES \`diagnosticos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diagnosticos_historico\` ADD CONSTRAINT \`FK_2f98f903dad0598d0db40fa0f72\` FOREIGN KEY (\`editorId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diagnosticos\` ADD CONSTRAINT \`FK_6277218516840fc9fe4f8b67390\` FOREIGN KEY (\`equipamentoId\`) REFERENCES \`equipamentos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diagnosticos\` ADD CONSTRAINT \`FK_99fbc49827c6975da2eac55d576\` FOREIGN KEY (\`autorId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` ADD CONSTRAINT \`FK_5cbfac23aac71d8a16962b7c0ff\` FOREIGN KEY (\`equipamentoId\`) REFERENCES \`equipamentos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` ADD CONSTRAINT \`FK_6cc5e30cb6365df6f4c4283ac45\` FOREIGN KEY (\`componenteSaidaId\`) REFERENCES \`componentes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` ADD CONSTRAINT \`FK_f6ab9c2c399519641eb2ff9915e\` FOREIGN KEY (\`componenteEntradaId\`) REFERENCES \`componentes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` ADD CONSTRAINT \`FK_98b82951945c298e033fab42300\` FOREIGN KEY (\`solicitanteId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` ADD CONSTRAINT \`FK_dda997f33efeda06ffb65b44206\` FOREIGN KEY (\`componenteId\`) REFERENCES \`componentes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` ADD CONSTRAINT \`FK_ac10446ab5ab65b5b57c83d2432\` FOREIGN KEY (\`equipamentoId\`) REFERENCES \`equipamentos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` ADD CONSTRAINT \`FK_42b4af4b4ba92971f6350092e7e\` FOREIGN KEY (\`tecnicoId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` ADD CONSTRAINT \`FK_efb0518806e417867dccd106904\` FOREIGN KEY (\`aprovadorId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ordens_manutencao\` ADD CONSTRAINT \`FK_f452d9a3ed8260e6acf54172a9d\` FOREIGN KEY (\`equipamentoId\`) REFERENCES \`equipamentos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ordens_manutencao\` ADD CONSTRAINT \`FK_8e84ee06bb226dc6f61f2a67b88\` FOREIGN KEY (\`solicitanteId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`equipamento_auditoria\` ADD CONSTRAINT \`FK_8a4ffbd1691762639471a4fcaa3\` FOREIGN KEY (\`equipamentoId\`) REFERENCES \`equipamentos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`equipamento_auditoria\` ADD CONSTRAINT \`FK_f640685d4158ef7bb1d78fc2930\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`alertas\` ADD CONSTRAINT \`FK_61872bfac0a5ce4113f8fc7f357\` FOREIGN KEY (\`componenteId\`) REFERENCES \`componentes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`om_tecnicos\` ADD CONSTRAINT \`FK_bcb6db50ff6561f813f432113d7\` FOREIGN KEY (\`om_id\`) REFERENCES \`ordens_manutencao\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`om_tecnicos\` ADD CONSTRAINT \`FK_184b22a3f1b62283598de6b0a36\` FOREIGN KEY (\`tecnico_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`om_tecnicos\` DROP FOREIGN KEY \`FK_184b22a3f1b62283598de6b0a36\``);
        await queryRunner.query(`ALTER TABLE \`om_tecnicos\` DROP FOREIGN KEY \`FK_bcb6db50ff6561f813f432113d7\``);
        await queryRunner.query(`ALTER TABLE \`alertas\` DROP FOREIGN KEY \`FK_61872bfac0a5ce4113f8fc7f357\``);
        await queryRunner.query(`ALTER TABLE \`equipamento_auditoria\` DROP FOREIGN KEY \`FK_f640685d4158ef7bb1d78fc2930\``);
        await queryRunner.query(`ALTER TABLE \`equipamento_auditoria\` DROP FOREIGN KEY \`FK_8a4ffbd1691762639471a4fcaa3\``);
        await queryRunner.query(`ALTER TABLE \`ordens_manutencao\` DROP FOREIGN KEY \`FK_8e84ee06bb226dc6f61f2a67b88\``);
        await queryRunner.query(`ALTER TABLE \`ordens_manutencao\` DROP FOREIGN KEY \`FK_f452d9a3ed8260e6acf54172a9d\``);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` DROP FOREIGN KEY \`FK_efb0518806e417867dccd106904\``);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` DROP FOREIGN KEY \`FK_42b4af4b4ba92971f6350092e7e\``);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` DROP FOREIGN KEY \`FK_ac10446ab5ab65b5b57c83d2432\``);
        await queryRunner.query(`ALTER TABLE \`reportes_substituicao\` DROP FOREIGN KEY \`FK_dda997f33efeda06ffb65b44206\``);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` DROP FOREIGN KEY \`FK_98b82951945c298e033fab42300\``);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` DROP FOREIGN KEY \`FK_f6ab9c2c399519641eb2ff9915e\``);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` DROP FOREIGN KEY \`FK_6cc5e30cb6365df6f4c4283ac45\``);
        await queryRunner.query(`ALTER TABLE \`solicitacoes_modificacao\` DROP FOREIGN KEY \`FK_5cbfac23aac71d8a16962b7c0ff\``);
        await queryRunner.query(`ALTER TABLE \`diagnosticos\` DROP FOREIGN KEY \`FK_99fbc49827c6975da2eac55d576\``);
        await queryRunner.query(`ALTER TABLE \`diagnosticos\` DROP FOREIGN KEY \`FK_6277218516840fc9fe4f8b67390\``);
        await queryRunner.query(`ALTER TABLE \`diagnosticos_historico\` DROP FOREIGN KEY \`FK_2f98f903dad0598d0db40fa0f72\``);
        await queryRunner.query(`ALTER TABLE \`diagnosticos_historico\` DROP FOREIGN KEY \`FK_34f8f857b540fda1f939620b72b\``);
        await queryRunner.query(`ALTER TABLE \`componentes\` DROP FOREIGN KEY \`FK_94285c1d4d6b31288972d57d514\``);
        await queryRunner.query(`DROP INDEX \`IDX_184b22a3f1b62283598de6b0a3\` ON \`om_tecnicos\``);
        await queryRunner.query(`DROP INDEX \`IDX_bcb6db50ff6561f813f432113d\` ON \`om_tecnicos\``);
        await queryRunner.query(`DROP TABLE \`om_tecnicos\``);
        await queryRunner.query(`DROP TABLE \`alertas\``);
        await queryRunner.query(`DROP TABLE \`equipamento_auditoria\``);
        await queryRunner.query(`DROP INDEX \`IDX_70ee6d8e10327c404d8ede2118\` ON \`ordens_manutencao\``);
        await queryRunner.query(`DROP TABLE \`ordens_manutencao\``);
        await queryRunner.query(`DROP TABLE \`reportes_substituicao\``);
        await queryRunner.query(`DROP TABLE \`solicitacoes_modificacao\``);
        await queryRunner.query(`DROP INDEX \`IDX_78734bbc9a45888ad5d7c1ca96\` ON \`equipamentos\``);
        await queryRunner.query(`DROP TABLE \`equipamentos\``);
        await queryRunner.query(`DROP TABLE \`diagnosticos\``);
        await queryRunner.query(`DROP TABLE \`diagnosticos_historico\``);
        await queryRunner.query(`DROP TABLE \`componentes\``);
        await queryRunner.query(`DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``);
        await queryRunner.query(`DROP INDEX \`IDX_007538d8a5c491d5639681d116\` ON \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`usuarios\``);
    }

}
