// src/components/reports/enrollment-report-pdf.tsx
'use client';
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6', // primary color
    paddingBottom: 10,
  },
  headerText: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  courseTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  summaryBox: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#4B5563',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 5,
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  colName: {
    width: '30%',
  },
  colEmail: {
    width: '30%',
  },
  colProgress: {
    width: '15%',
    textAlign: 'center',
  },
  colStatus: {
    width: '15%',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
});

export const EnrollmentReportPDF = ({ course, platformLogo }: { course: any, platformLogo: string | null | undefined }) => {

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'dd/MM/yyyy');
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {platformLogo && <Image style={styles.logo} src={platformLogo} />}
                    <View style={styles.headerText}>
                        <Text style={styles.reportTitle}>Reporte de Progreso</Text>
                        <Text style={styles.courseTitle}>{course.title}</Text>
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{course._count.enrollments}</Text>
                        <Text style={styles.summaryLabel}>Total Inscritos</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{course.avgProgress?.toFixed(0) || 0}%</Text>
                        <Text style={styles.summaryLabel}>Progreso Promedio</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{course.avgQuizScore?.toFixed(0) || 0}%</Text>
                        <Text style={styles.summaryLabel}>Nota Quizzes Promedio</Text>
                    </View>
                </View>
                
                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colName}>Estudiante</Text>
                        <Text style={styles.colEmail}>Email</Text>
                        <Text style={styles.colProgress}>Progreso</Text>
                        <Text style={styles.colStatus}>Estado</Text>
                    </View>
                    {course.enrollments.map((enrollment: any, index: number) => (
                         <View key={enrollment.user.id} style={[styles.tableRow, index % 2 === 0 ? {} : styles.tableRowEven]}>
                            <Text style={styles.colName}>{enrollment.user.name}</Text>
                            <Text style={styles.colEmail}>{enrollment.user.email}</Text>
                            <Text style={styles.colProgress}>{enrollment.progress?.progressPercentage?.toFixed(0) || 0}%</Text>
                             <Text style={styles.colStatus}>{enrollment.progress?.completedAt ? 'Completado' : 'En Progreso'}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Reporte generado el {format(new Date(), "dd 'de' MMMM, yyyy 'a las' HH:mm")} - Página {'1'}
                </Text>
            </Page>
        </Document>
    );
};
